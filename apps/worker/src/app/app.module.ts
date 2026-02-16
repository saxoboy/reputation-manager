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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL') || 'localhost:6379';
        return {
          connection: {
            host: redisUrl.includes('://')
              ? new URL(redisUrl).hostname
              : redisUrl.split(':')[0] || 'localhost',
            port: redisUrl.includes('://')
              ? parseInt(new URL(redisUrl).port || '6379')
              : parseInt(redisUrl.split(':')[1] || '6379'),
            password: redisUrl.includes('://')
              ? new URL(redisUrl).password || undefined
              : undefined,
          },
        };
      },
      inject: [ConfigService],
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
