import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@reputation-manager/database';
import {
  TwilioService,
  WhatsAppService,
  GooglePlacesService,
} from '@reputation-manager/integrations';
import { QUEUES } from '@reputation-manager/shared-types';
import { CampaignProcessor } from '../processors/campaign.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUEUES.CAMPAIGNS,
    }),
  ],
  controllers: [],
  providers: [
    PrismaService,
    TwilioService,
    WhatsAppService,
    GooglePlacesService,
    CampaignProcessor,
  ],
})
export class AppModule {}
