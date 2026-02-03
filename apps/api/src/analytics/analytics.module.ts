import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { PrismaService } from '@reputation-manager/database';

@Module({
  imports: [],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ExportService, PrismaService],
  exports: [AnalyticsService, ExportService],
})
export class AnalyticsModule {}
