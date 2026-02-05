import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { StripeService } from '@reputation-manager/integrations';
import {
  PlanType,
  PLAN_PRICES,
  CREDIT_PACKAGES,
  CreateSubscriptionDto,
  CancelSubscriptionDto,
  PurchaseCreditsDto,
  BillingInfoDto,
} from './dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  /**
   * Get current billing information for a workspace
   */
  async getBillingInfo(workspaceId: string): Promise<BillingInfoDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        plan: true,
        messageCredits: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if customer has a payment method
    let hasPaymentMethod = false;
    if (workspace.stripeCustomerId) {
      try {
        const paymentMethods = await this.stripe['stripe'].paymentMethods.list({
          customer: workspace.stripeCustomerId,
          type: 'card',
        });
        hasPaymentMethod = paymentMethods.data.length > 0;
      } catch (error) {
        this.logger.warn(`Failed to check payment methods: ${error.message}`);
      }
    }

    return {
      plan: workspace.plan as PlanType,
      messageCredits: workspace.messageCredits,
      subscriptionStatus: workspace.subscriptionStatus,
      subscriptionPeriodEnd: workspace.subscriptionPeriodEnd,
      cancelAtPeriodEnd: workspace.cancelAtPeriodEnd,
      stripeCustomerId: workspace.stripeCustomerId,
      hasPaymentMethod,
    };
  }

  /**
   * Get available plans
   */
  getAvailablePlans() {
    return Object.entries(PLAN_PRICES).map(([plan, details]) => ({
      plan,
      ...details,
    }));
  }

  /**
   * Get available credit packages
   */
  getAvailableCreditPackages() {
    return Object.entries(CREDIT_PACKAGES).map(([name, details]) => ({
      name,
      ...details,
    }));
  }

  /**
   * Create or get Stripe customer for workspace
   */
  private async ensureStripeCustomer(workspaceId: string): Promise<string> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        users: {
          include: { user: true },
          where: { role: 'OWNER' },
          take: 1,
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // If already has customer, return it
    if (workspace.stripeCustomerId) {
      return workspace.stripeCustomerId;
    }

    // Create new customer
    const owner = workspace.users[0]?.user;
    if (!owner) {
      throw new BadRequestException('Workspace has no owner');
    }

    const customer = await this.stripe.createCustomer({
      email: owner.email,
      name: owner.name || workspace.name,
      metadata: {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      },
    });

    // Update workspace with customer ID
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  async createSubscriptionCheckout(
    workspaceId: string,
    dto: CreateSubscriptionDto,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    // Validate plan
    if (dto.plan === PlanType.FREE) {
      throw new BadRequestException('Cannot create subscription for FREE plan');
    }

    if (dto.plan === PlanType.ENTERPRISE) {
      throw new BadRequestException('Enterprise plan requires custom setup');
    }

    const planPrice = PLAN_PRICES[dto.plan];
    const priceId =
      dto.interval === 'yearly'
        ? planPrice.stripePriceIdYearly
        : planPrice.stripePriceIdMonthly;

    if (!priceId) {
      throw new InternalServerErrorException(
        'Stripe price ID not configured for this plan',
      );
    }

    // Ensure customer exists
    const customerId = await this.ensureStripeCustomer(workspaceId);

    // Create checkout session
    const session = await this.stripe.createCheckoutSession({
      customerId,
      priceId,
      mode: 'subscription',
      successUrl:
        dto.successUrl ||
        `${process.env['FRONTEND_URL']}/dashboard/billing/success`,
      cancelUrl:
        dto.cancelUrl || `${process.env['FRONTEND_URL']}/dashboard/billing`,
      metadata: {
        workspaceId,
        plan: dto.plan,
        interval: dto.interval,
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Create a checkout session for credit purchase
   */
  async createCreditCheckout(
    workspaceId: string,
    dto: PurchaseCreditsDto,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    // Validate credits amount
    if (dto.credits < 1) {
      throw new BadRequestException('Credits must be at least 1');
    }

    // Calculate price (use package pricing if matches, otherwise custom)
    let price: number;
    let pricePerCredit: number;

    const matchedPackage = Object.values(CREDIT_PACKAGES).find(
      (pkg) => pkg.credits === dto.credits,
    );

    if (matchedPackage) {
      price = matchedPackage.price;
      pricePerCredit = matchedPackage.pricePerCredit;
    } else {
      // Custom amount - use base pricing ($0.10 per credit)
      pricePerCredit = 0.1;
      price = Math.round(dto.credits * pricePerCredit * 100); // Convert to cents
    }

    // Ensure customer exists
    const customerId = await this.ensureStripeCustomer(workspaceId);

    // Create payment intent
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: price,
      currency: 'usd',
      customerId,
      metadata: {
        workspaceId,
        credits: dto.credits.toString(),
        pricePerCredit: pricePerCredit.toString(),
      },
    });

    // Create transaction record
    await this.prisma.transaction.create({
      data: {
        workspaceId,
        stripePaymentIntentId: paymentIntent.id,
        type: 'CREDIT_PURCHASE',
        status: 'PENDING',
        amount: price,
        currency: 'usd',
        creditsAdded: dto.credits,
        description: `Purchase of ${dto.credits} message credits`,
        metadata: {
          pricePerCredit,
        },
      },
    });

    if (!paymentIntent.client_secret) {
      throw new InternalServerErrorException('Failed to create payment intent');
    }

    // For now, return payment intent client secret
    // In frontend, you'd use Stripe Elements to complete payment
    return {
      checkoutUrl: paymentIntent.client_secret,
      sessionId: paymentIntent.id,
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    workspaceId: string,
    dto: CancelSubscriptionDto,
  ): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || !workspace.stripeSubscriptionId) {
      throw new NotFoundException('No active subscription found');
    }

    const atPeriodEnd = dto.when === 'period_end';

    await this.stripe.cancelSubscription(
      workspace.stripeSubscriptionId,
      atPeriodEnd,
    );

    // Update workspace
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        subscriptionStatus: atPeriodEnd
          ? workspace.subscriptionStatus
          : 'canceled',
      },
    });

    return {
      success: true,
      message: atPeriodEnd
        ? 'Subscription will be canceled at the end of the billing period'
        : 'Subscription canceled immediately',
    };
  }

  /**
   * Resume a subscription that was set to cancel
   */
  async resumeSubscription(
    workspaceId: string,
  ): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || !workspace.stripeSubscriptionId) {
      throw new NotFoundException('No subscription found');
    }

    if (!workspace.cancelAtPeriodEnd) {
      throw new BadRequestException('Subscription is not set to cancel');
    }

    await this.stripe.resumeSubscription(workspace.stripeSubscriptionId);

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { cancelAtPeriodEnd: false },
    });

    return {
      success: true,
      message: 'Subscription resumed successfully',
    };
  }

  /**
   * Get billing portal URL for customer to manage subscription
   */
  async getBillingPortalUrl(workspaceId: string): Promise<{ url: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || !workspace.stripeCustomerId) {
      throw new NotFoundException('No Stripe customer found');
    }

    const session = await this.stripe.createBillingPortalSession({
      customerId: workspace.stripeCustomerId,
      returnUrl: `${process.env['FRONTEND_URL']}/dashboard/billing`,
    });

    return { url: session.url };
  }

  /**
   * Get transaction history for workspace
   */
  async getTransactions(workspaceId: string, limit = 50) {
    return this.prisma.transaction.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Deduct credits from workspace (called when sending messages)
   */
  async deductCredits(workspaceId: string, amount: number): Promise<boolean> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if has enough credits (or unlimited on ENTERPRISE)
    if (
      workspace.plan !== PlanType.ENTERPRISE &&
      workspace.messageCredits < amount
    ) {
      throw new BadRequestException('Insufficient message credits');
    }

    // Deduct credits (only if not ENTERPRISE with unlimited)
    if (workspace.plan !== PlanType.ENTERPRISE) {
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { messageCredits: { decrement: amount } },
      });
    }

    return true;
  }

  /**
   * Add credits to workspace
   */
  async addCredits(
    workspaceId: string,
    amount: number,
    reason = 'Manual adjustment',
  ) {
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { messageCredits: { increment: amount } },
    });

    // Create transaction record
    await this.prisma.transaction.create({
      data: {
        workspaceId,
        type: 'CREDIT_ADJUSTMENT',
        status: 'SUCCEEDED',
        amount: 0,
        currency: 'usd',
        creditsAdded: amount,
        description: reason,
      },
    });

    this.logger.log(
      `✅ Added ${amount} credits to workspace ${workspaceId}: ${reason}`,
    );
  }
}
