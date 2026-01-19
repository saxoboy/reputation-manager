import { Module } from '@nestjs/common';
import { PracticesController } from './practices.controller';
import { PracticesService } from './practices.service';
import { PrismaService } from '@reputation-manager/database';

@Module({
  controllers: [PracticesController],
  providers: [PracticesService, PrismaService],
  exports: [PracticesService],
})
export class PracticesModule {}
