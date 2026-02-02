import { Module } from '@nestjs/common';
import { PracticesController } from './practices.controller';
import { PracticesService } from './practices.service';
import { PrismaService } from '@reputation-manager/database';
import { GooglePlacesService } from '@reputation-manager/integrations';

@Module({
  controllers: [PracticesController],
  providers: [PracticesService, PrismaService, GooglePlacesService],
  exports: [PracticesService],
})
export class PracticesModule {}
