import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { SendGridService } from '@reputation-manager/integrations';

@Module({
  controllers: [FeedbackController],
  providers: [SendGridService],
})
export class FeedbackModule {}
