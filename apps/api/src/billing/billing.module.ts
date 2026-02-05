import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaService } from '@reputation-manager/database';
import { StripeService } from '@reputation-manager/integrations';

@Module({
  imports: [],
  controllers: [BillingController],
  providers: [BillingService, PrismaService, StripeService],
  exports: [BillingService],
})
export class BillingModule {}
