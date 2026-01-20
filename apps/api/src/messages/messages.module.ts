import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
  MessagesController,
  CampaignMessagesController,
  PatientMessagesController,
} from './messages.controller';
import { PrismaService } from '@reputation-manager/database';

@Module({
  controllers: [
    MessagesController,
    CampaignMessagesController,
    PatientMessagesController,
  ],
  providers: [MessagesService, PrismaService],
  exports: [MessagesService],
})
export class MessagesModule {}
