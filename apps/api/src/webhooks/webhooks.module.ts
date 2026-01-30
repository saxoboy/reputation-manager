import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@reputation-manager/database';
import {
  TwilioService,
  WhatsAppService,
} from '@reputation-manager/integrations';
import { QUEUES } from '@reputation-manager/shared-types';
import { TwilioWebhookController } from './twilio-webhook.controller';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.CAMPAIGNS,
    }),
  ],
  controllers: [TwilioWebhookController, WhatsAppWebhookController],
  providers: [PrismaService, TwilioService, WhatsAppService],
})
export class WebhooksModule {}
