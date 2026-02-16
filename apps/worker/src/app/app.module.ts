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
        host: process.env.REDIS_URL?.includes('://')
          ? new URL(process.env.REDIS_URL).hostname
          : process.env.REDIS_URL?.split(':')[0] || 'localhost',
        port: process.env.REDIS_URL?.includes('://')
          ? parseInt(new URL(process.env.REDIS_URL).port || '6379')
          : parseInt(process.env.REDIS_URL?.split(':')[1] || '6379'),
        password: process.env.REDIS_URL?.includes('://')
          ? new URL(process.env.REDIS_URL).password || undefined
          : undefined,
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
