import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import {
  PatientsController,
  CampaignPatientsController,
} from './patients.controller';
import { PrismaService } from '@reputation-manager/database';

@Module({
  controllers: [PatientsController, CampaignPatientsController],
  providers: [PatientsService, PrismaService],
  exports: [PatientsService],
})
export class PatientsModule {}
