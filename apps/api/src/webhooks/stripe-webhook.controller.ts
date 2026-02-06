import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService, EmailService } from '@reputation-manager/integrations';
import { PrismaService } from '@reputation-manager/database';
import { PLAN_PRICES, PlanType } from '../billing/dto';
import Stripe from 'stripe';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.error('Missing raw body for webhook verification');
      throw new BadRequestException('Missing request body');
    }

    // Get webhook secret from env
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = this.stripe.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error(
        `⚠️ Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log(`📥 Received Stripe webhook: ${event.type} (${event.id})`);

    // Handle different event types
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(
        `Error processing webhook ${event.type}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const workspaceId = subscription.metadata.workspaceId;
    if (!workspaceId) {
      this.logger.warn('Subscription missing workspaceId in metadata');
      return;
    }

    // Determine plan from subscription items
    const planType = subscription.metadata.plan as PlanType;
    const interval = subscription.metadata.interval as 'monthly' | 'yearly';

    // Get plan credits
    const planCredits = PLAN_PRICES[planType]?.credits || 0;

    // TypeScript doesn't recognize some Stripe properties - cast to any to access runtime values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionAny = subscription as any;

    // Update workspace
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPeriodEnd: new Date(
          subscriptionAny.current_period_end * 1000,
        ),
        cancelAtPeriodEnd: subscriptionAny.cancel_at_period_end as boolean,
        plan: planType,
        // Reset credits to plan amount on subscription start/renewal
        messageCredits: planCredits,
      },
    });

    this.logger.log(
      `✅ Updated subscription for workspace ${workspaceId}: ${planType} (${interval}), ${planCredits} credits`,
    );
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const workspaceId = subscription.metadata.workspaceId;
    if (!workspaceId) {
      this.logger.warn('Subscription missing workspaceId in metadata');
      return;
    }

    // Downgrade to FREE plan
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        plan: PlanType.FREE,
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
        messageCredits: PLAN_PRICES.FREE.credits,
      },
    });

    this.logger.log(
      `✅ Subscription canceled for workspace ${workspaceId}, downgraded to FREE`,
    );
  }

  /**
   * Handle invoice paid (subscription renewed)
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Cast to any to access properties not in TS definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceAny = invoice as any;

    // Get workspace ID from subscription metadata
    let workspaceId: string | undefined;

    if (
      typeof invoiceAny.subscription === 'string' &&
      invoiceAny.subscription
    ) {
      // Fetch full subscription to get metadata
      try {
        const subscription = await this.stripe['stripe'].subscriptions.retrieve(
          invoiceAny.subscription,
        );
        workspaceId = subscription.metadata.workspaceId;
      } catch (error) {
        this.logger.warn(
          `Failed to fetch subscription metadata: ${error.message}`,
        );
      }
    }

    if (!workspaceId) {
      this.logger.warn('Invoice missing workspaceId');
      return;
    }

    // Create transaction record
    await this.prisma.transaction.create({
      data: {
        workspaceId,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId:
          typeof invoiceAny.payment_intent === 'string'
            ? invoiceAny.payment_intent
            : invoiceAny.payment_intent?.id,
        stripeChargeId:
          typeof invoiceAny.charge === 'string'
            ? invoiceAny.charge
            : invoiceAny.charge?.id,
        type: 'SUBSCRIPTION_PAYMENT',
        status: 'SUCCEEDED',
        amount: invoice.amount_paid,
        currency: invoice.currency,
        creditsAdded: 0, // Credits added via subscription update
        description: `Subscription payment: ${invoice.lines.data[0]?.description || 'Subscription'}`,
      },
    });

    this.logger.log(
      `✅ Invoice paid for workspace ${workspaceId}: $${invoice.amount_paid / 100}`,
    );
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Cast to any to access properties not in TS definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceAny = invoice as any;

    // Get workspace ID from subscription metadata
    let workspaceId: string | undefined;

    if (
      typeof invoiceAny.subscription === 'string' &&
      invoiceAny.subscription
    ) {
      try {
        const subscription = await this.stripe['stripe'].subscriptions.retrieve(
          invoiceAny.subscription,
        );
        workspaceId = subscription.metadata.workspaceId;
      } catch (error) {
        this.logger.warn(
          `Failed to fetch subscription metadata: ${error.message}`,
        );
      }
    }

    if (!workspaceId) {
      this.logger.warn('Invoice missing workspaceId');
      return;
    }

    // Update subscription status
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { subscriptionStatus: 'past_due' },
    });

    // Create failed transaction record
    await this.prisma.transaction.create({
      data: {
        workspaceId,
        stripeInvoiceId: invoice.id,
        type: 'SUBSCRIPTION_PAYMENT',
        status: 'FAILED',
        amount: invoice.amount_due,
        currency: invoice.currency,
        creditsAdded: 0,
        description: `Failed subscription payment: ${invoice.lines.data[0]?.description || 'Subscription'}`,
      },
    });

    this.logger.error(`❌ Invoice payment failed for workspace ${workspaceId}`);

    // Notify workspace owner about failed payment
    await this.sendPaymentNotification(workspaceId, {
      type: 'failed',
      subject: '⚠️ Pago de suscripción fallido - Reputation Manager',
      amount: invoice.amount_due,
      currency: invoice.currency,
      description: invoice.lines.data[0]?.description || 'Pago de suscripción',
    });
  }

  /**
   * Handle payment intent succeeded (credit purchase)
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const workspaceId = paymentIntent.metadata.workspaceId;
    const credits = parseInt(paymentIntent.metadata.credits || '0', 10);

    if (!workspaceId || !credits) {
      this.logger.warn(
        'PaymentIntent missing workspaceId or credits in metadata',
      );
      return;
    }

    // Add credits to workspace
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { messageCredits: { increment: credits } },
    });

    // Update transaction status
    await this.prisma.transaction.updateMany({
      where: {
        workspaceId,
        stripePaymentIntentId: paymentIntent.id,
      },
      data: { status: 'SUCCEEDED' },
    });

    this.logger.log(
      `✅ Added ${credits} credits to workspace ${workspaceId} (payment ${paymentIntent.id})`,
    );

    // Notify workspace owner about successful credit purchase
    await this.sendPaymentNotification(workspaceId, {
      type: 'succeeded',
      subject: '✅ Compra de créditos exitosa - Reputation Manager',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: `${credits} créditos de mensajes agregados`,
    });
  }

  /**
   * Handle payment intent failed (credit purchase)
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const workspaceId = paymentIntent.metadata.workspaceId;

    if (!workspaceId) {
      this.logger.warn('PaymentIntent missing workspaceId in metadata');
      return;
    }

    // Update transaction status
    await this.prisma.transaction.updateMany({
      where: {
        workspaceId,
        stripePaymentIntentId: paymentIntent.id,
      },
      data: { status: 'FAILED' },
    });

    this.logger.error(
      `❌ Credit purchase failed for workspace ${workspaceId} (payment ${paymentIntent.id})`,
    );

    // Notify workspace owner about failed credit purchase
    await this.sendPaymentNotification(workspaceId, {
      type: 'failed',
      subject: '⚠️ Compra de créditos fallida - Reputation Manager',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: 'Compra de créditos de mensajes',
    });
  }

  /**
   * Send payment notification email to workspace owner
   */
  private async sendPaymentNotification(
    workspaceId: string,
    details: {
      type: 'succeeded' | 'failed';
      subject: string;
      amount: number;
      currency: string;
      description: string;
    },
  ): Promise<void> {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          users: {
            where: { role: 'OWNER' },
            include: { user: true },
            take: 1,
          },
        },
      });

      const owner = workspace?.users[0]?.user;
      if (!owner?.email) {
        this.logger.warn(
          `No owner email found for workspace ${workspaceId}, skipping notification`,
        );
        return;
      }

      if (details.type === 'succeeded') {
        await this.emailService.sendInvoiceEmail({
          email: owner.email,
          name: owner.name || 'Usuario',
          invoiceUrl: `${process.env['FRONTEND_URL'] || 'http://localhost:4000'}/dashboard/billing`,
          amount: details.amount,
          currency: details.currency,
          date: new Date().toLocaleDateString('es-EC'),
        });
      } else {
        // For failed payments, use a generic email with the failure info
        await this.emailService.sendLowCreditsAlert({
          workspaceId,
          workspaceName: workspace?.name,
          ownerEmail: owner.email,
          ownerName: owner.name || 'Usuario',
          alertLevel: 'critical',
          remainingCredits: workspace?.messageCredits ?? 0,
          percentageRemaining: 0,
          plan: workspace?.plan || 'FREE',
          planLimit: 0,
          subject: details.subject,
          ctaUrl: `${process.env['FRONTEND_URL'] || 'http://localhost:4000'}/dashboard/billing`,
        });
      }

      this.logger.log(
        `📧 Payment notification (${details.type}) sent to ${owner.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment notification for workspace ${workspaceId}`,
        error,
      );
      // Don't throw - email failure shouldn't break webhook processing
    }
  }
}
