import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BillingService } from './billing.service';
import {
  CreateSubscriptionDto,
  CancelSubscriptionDto,
  PurchaseCreditsDto,
  BillingInfoDto,
} from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';

@Controller('workspaces/:workspaceId/billing')
@UseGuards(AuthGuard, WorkspaceGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * GET /workspaces/:workspaceId/billing
   * Get current billing information
   */
  @Get()
  async getBillingInfo(
    @Param('workspaceId') workspaceId: string,
  ): Promise<BillingInfoDto> {
    return this.billingService.getBillingInfo(workspaceId);
  }

  /**
   * GET /workspaces/:workspaceId/billing/plans
   * Get available subscription plans
   */
  @Get('plans')
  async getPlans() {
    return this.billingService.getAvailablePlans();
  }

  /**
   * GET /workspaces/:workspaceId/billing/credit-packages
   * Get available credit packages
   */
  @Get('credit-packages')
  async getCreditPackages() {
    return this.billingService.getAvailableCreditPackages();
  }

  /**
   * POST /workspaces/:workspaceId/billing/subscribe
   * Create checkout session for new subscription
   * @roles OWNER
   */
  @Post('subscribe')
  @UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
  @Roles(UserRole.OWNER)
  async createSubscription(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.billingService.createSubscriptionCheckout(workspaceId, dto);
  }

  /**
   * POST /workspaces/:workspaceId/billing/credits
   * Create checkout session for credit purchase
   * @roles OWNER
   */
  @Post('credits')
  @UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
  @Roles(UserRole.OWNER)
  async purchaseCredits(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: PurchaseCreditsDto,
  ) {
    return this.billingService.createCreditCheckout(workspaceId, dto);
  }

  /**
   * POST /workspaces/:workspaceId/billing/cancel
   * Cancel subscription
   * @roles OWNER
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
  @Roles(UserRole.OWNER)
  async cancelSubscription(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.billingService.cancelSubscription(workspaceId, dto);
  }

  /**
   * POST /workspaces/:workspaceId/billing/resume
   * Resume canceled subscription
   * @roles OWNER
   */
  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
  @Roles(UserRole.OWNER)
  async resumeSubscription(@Param('workspaceId') workspaceId: string) {
    return this.billingService.resumeSubscription(workspaceId);
  }

  /**
   * GET /workspaces/:workspaceId/billing/portal
   * Get Stripe billing portal URL
   * @roles OWNER
   */
  @Get('portal')
  @UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
  @Roles(UserRole.OWNER)
  async getBillingPortal(@Param('workspaceId') workspaceId: string) {
    return this.billingService.getBillingPortalUrl(workspaceId);
  }

  /**
   * GET /workspaces/:workspaceId/billing/transactions
   * Get transaction history
   */
  @Get('transactions')
  async getTransactions(@Param('workspaceId') workspaceId: string) {
    return this.billingService.getTransactions(workspaceId);
  }

  /**
   * GET /workspaces/:workspaceId/billing/can-send
   * Check if workspace has enough credits to send messages
   * Used for pre-validation before enqueuing jobs
   */
  @Get('can-send')
  async canSendMessages(@Param('workspaceId') workspaceId: string) {
    return this.billingService.canSendMessage(workspaceId, 1);
  }

  /**
   * GET /workspaces/:workspaceId/billing/credits-alert
   * Get low credits alert level and notification status
   */
  @Get('credits-alert')
  async getCreditsAlert(@Param('workspaceId') workspaceId: string) {
    return this.billingService.checkLowCreditsAlert(workspaceId);
  }
}
