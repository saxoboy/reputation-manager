import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WeeklyReportsController } from './weekly-reports.controller';
import { WeeklyReportsService } from './weekly-reports.service';
import { PrismaService } from '@reputation-manager/database';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'weekly-reports',
    }),
  ],
  controllers: [WeeklyReportsController],
  providers: [WeeklyReportsService, PrismaService],
  exports: [WeeklyReportsService],
})
export class WeeklyReportsModule {}
