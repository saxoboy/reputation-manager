import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@reputation-manager/database';
import { TwilioService } from '@reputation-manager/integrations';
import { QUEUES, JOBS } from '@reputation-manager/shared-types';
import { Public } from '../auth/decorators/public.decorator';

interface TwilioSmsWebhook {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
}

@Controller('webhooks/twilio')
export class TwilioWebhookController {
  private readonly logger = new Logger(TwilioWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    @InjectQueue(QUEUES.CAMPAIGNS) private campaignQueue: Queue,
  ) {}

  @Public()
  @Post('sms')
  async handleIncomingSMS(
    @Body() body: TwilioSmsWebhook,
    @Headers('x-twilio-signature') signature: string,
  ) {
    this.logger.log(`📥 Incoming SMS from ${body.From}: "${body.Body}"`);

    // Verify Twilio signature
    if (
      !this.verifySignature(
        signature,
        body as unknown as Record<string, unknown>,
      )
    ) {
      this.logger.warn('Invalid Twilio signature');
      throw new UnauthorizedException('Invalid signature');
    }

    const { From, Body: messageBody } = body;

    // Find patient by phone
    const patient = await this.prisma.patient.findFirst({
      where: {
        phone: From,
        optedOutAt: null, // Ignore opted-out patients
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
      this.logger.warn(`Patient not found for phone ${From}`);
      return this.twilioResponse('Gracias por tu mensaje.');
    }

    // Check if already responded
    const lastInitialMessage = patient.messages[0];
    if (!lastInitialMessage) {
      this.logger.warn(`No initial message found for patient ${patient.id}`);
      return this.twilioResponse('Gracias por tu mensaje.');
    }

    if (lastInitialMessage.rating !== null) {
      this.logger.log(`Patient ${patient.id} already responded`);
      return this.twilioResponse('Ya recibimos tu calificación. ¡Gracias!');
    }

    // Check for opt-out keywords
    if (this.isOptOutMessage(messageBody)) {
      await this.handleOptOut(patient.id);
      return this.twilioResponse(
        'Has sido dado de baja. No recibirás más mensajes.',
      );
    }

    // Parse rating (1-5)
    const rating = this.parseRating(messageBody);

    if (rating === null) {
      this.logger.warn(`Invalid rating from ${From}: "${messageBody}"`);
      return this.twilioResponse(
        'Por favor responde con un número del 1 al 5.',
      );
    }

    // Enqueue job to handle response
    await this.campaignQueue.add(
      JOBS.HANDLE_RESPONSE,
      {
        messageId: lastInitialMessage.id,
        rating,
        text: messageBody,
        from: From,
      },
      { priority: 1 }, // High priority
    );

    this.logger.log(
      `✅ Response queued for patient ${patient.id} with rating ${rating}`,
    );

    return this.twilioResponse('¡Gracias por tu respuesta!');
  }

  /**
   * Verify Twilio webhook signature
   */
  private verifySignature(
    signature: string,
    params: Record<string, unknown>,
  ): boolean {
    if (!signature) {
      this.logger.warn('No signature provided');
      return false;
    }

    // Get full webhook URL (need to construct it)
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || '';

    return this.twilioService.validateWebhookSignature(
      signature,
      webhookUrl,
      params,
    );
  }

  /**
   * Parse rating from message body
   */
  private parseRating(body: string): number | null {
    const trimmed = body.trim();

    // Try exact number match (1-5)
    const exactMatch = trimmed.match(/^[1-5]$/);
    if (exactMatch) {
      return parseInt(exactMatch[0], 10);
    }

    // Try to find a number in the message
    const numberMatch = trimmed.match(/([1-5])/);
    if (numberMatch) {
      return parseInt(numberMatch[1], 10);
    }

    return null;
  }

  /**
   * Check if message is an opt-out request
   */
  private isOptOutMessage(body: string): boolean {
    const lowerBody = body.toLowerCase().trim();
    const optOutKeywords = ['stop', 'unsubscribe', 'cancel', 'baja', 'salir'];

    return optOutKeywords.some((keyword) => lowerBody.includes(keyword));
  }

  /**
   * Handle patient opt-out
   */
  private async handleOptOut(patientId: string): Promise<void> {
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { optedOutAt: new Date() },
    });

    this.logger.log(`Patient ${patientId} opted out`);
  }

  /**
   * Generate TwiML response
   */
  private twilioResponse(message: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
  }
}
