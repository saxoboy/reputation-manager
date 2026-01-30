import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@reputation-manager/database';
import { QUEUES, JOBS } from '@reputation-manager/shared-types';
import { Public } from '../auth/decorators/public.decorator';

interface WhatsAppWebhookBody {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          text?: { body: string };
          interactive?: { button_reply?: { title: string } };
          button?: { text: string };
        }>;
      };
    }>;
  }>;
}

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.CAMPAIGNS) private campaignsQueue: Queue,
  ) {}

  @Public()
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const MY_VERIFY_TOKEN = this.configService.get<string>(
      'WHATSAPP_VERIFY_TOKEN',
    );

    if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {
      this.logger.log('WhatsApp webhook verified successfully');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.error('WhatsApp webhook verification failed');
    return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
  }

  @Public()
  @Post()
  async handleIncomingMessage(
    @Body() body: WhatsAppWebhookBody,
    @Res() res: Response,
  ) {
    // Return 200 checks immediately
    if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
    }

    try {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // Phone number (usually no +)
      const textBody =
        message.text?.body ||
        message.interactive?.button_reply?.title ||
        message.button?.text;

      if (!from || !textBody) {
        return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
      }

      this.logger.log(
        `Processing WhatsApp message from ${from}: "${textBody}"`,
      );

      // WhatsApp API often sends number without '+' (e.g. 59399...)
      // Our DB has '+' (e.g. +59399...)
      // We search for both just in case
      const possiblePhones = [`+${from}`, from];

      const patient = await this.prisma.patient.findFirst({
        where: {
          phone: { in: possiblePhones },
          optedOutAt: null,
        },
        include: {
          messages: {
            where: {
              type: 'INITIAL',
              status: 'SENT',
            },
            orderBy: {
              sentAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!patient) {
        this.logger.warn(`Patient not found for phone: ${from}`);
        return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
      }

      const lastInitialMessage = patient.messages[0];
      if (!lastInitialMessage) {
        this.logger.warn(
          `No pending initial message for patient ${patient.id}`,
        );
        return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
      }

      if (lastInitialMessage.rating !== null) {
        this.logger.log(`Patient ${patient.id} already responded`);
        return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
      }

      // TODO: Handle Opt-Out (STOP)

      // Parse rating
      const rating = this.parseRating(textBody);
      if (rating === null) {
        this.logger.warn(`Invalid rating from ${from}: "${textBody}"`);
        // We could send a reply here asking for clarification, but avoiding infinite loops
        return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
      }

      // Add handle-response job
      await this.campaignsQueue.add(
        JOBS.HANDLE_RESPONSE,
        {
          messageId: lastInitialMessage.id,
          rating,
          text: textBody,
          from: from,
        },
        { priority: 1 },
      );

      this.logger.log(
        `Queued handle-response for patient ${patient.id} (Rating: ${rating})`,
      );

      return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
    } catch (error) {
      this.logger.error('Error processing WhatsApp webhook', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('ERROR');
    }
  }

  private parseRating(body: string): number | null {
    const trimmed = body.trim();

    // 1. Exact number (e.g. "5")
    if (/^[1-5]$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    // 2. Fraction pattern (e.g. "4/5", "3 / 5")
    const fractionMatch = trimmed.match(/([1-5])\s*\/\s*5/);
    if (fractionMatch) {
      return parseInt(fractionMatch[1], 10);
    }

    // 3. "X stars" at the beginning (e.g. "5 stars", "5 estrellas")
    const startMatch = trimmed.match(/^([1-5])\s+/);
    if (startMatch) {
      return parseInt(startMatch[1], 10);
    }

    // 4. Fallback: Check for single digits if unambiguous?
    // For safety, let's only do strict matching for now to avoid "I am 50 years old" triggering a 5 star rating.
    return null;
  }
}
