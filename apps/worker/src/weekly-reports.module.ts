import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { SendWeeklyReportProcessor } from './processors/send-weekly-report.processor';
import { WeeklyReportScheduler } from './schedulers/weekly-report.scheduler';
import { PrismaService } from '@reputation-manager/database';
import { SendGridService } from '@reputation-manager/integrations';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'weekly-reports',
    }),
  ],
  providers: [
    SendWeeklyReportProcessor,
    WeeklyReportScheduler,
    PrismaService,
    SendGridService,
  ],
})
export class WeeklyReportsModule {}
