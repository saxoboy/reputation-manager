import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@reputation-manager/database';
import { TwilioService } from '@reputation-manager/integrations';
import { QUEUES } from '@reputation-manager/shared-types';
import { TwilioWebhookController } from './twilio-webhook.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.CAMPAIGNS,
    }),
  ],
  controllers: [TwilioWebhookController],
  providers: [PrismaService, TwilioService],
})
export class WebhooksModule {}
