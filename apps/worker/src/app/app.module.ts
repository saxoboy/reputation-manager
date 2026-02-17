import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@reputation-manager/database';
import {
  TwilioService,
  WhatsAppService,
  GooglePlacesService,
  EmailService,
} from '@reputation-manager/integrations';
import { QUEUES } from '@reputation-manager/shared-types';
import { CampaignProcessor } from '../processors/campaign.processor';
import { WeeklyReportsModule } from '../weekly-reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue({
      name: QUEUES.CAMPAIGNS,
    }),
    WeeklyReportsModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    TwilioService,
    WhatsAppService,
    GooglePlacesService,
    EmailService,
    CampaignProcessor,
  ],
})
export class AppModule {}
