import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@reputation-manager/database';
import {
  TwilioService,
  WhatsAppService,
  StripeService,
} from '@reputation-manager/integrations';
import { QUEUES } from '@reputation-manager/shared-types';
import { TwilioWebhookController } from './twilio-webhook.controller';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.CAMPAIGNS,
    }),
  ],
  controllers: [
    TwilioWebhookController,
    WhatsAppWebhookController,
    StripeWebhookController,
  ],
  providers: [PrismaService, TwilioService, WhatsAppService, StripeService],
})
export class WebhooksModule {}
