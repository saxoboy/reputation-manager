import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

interface StripeError extends Error {
  code?: string;
  type?: string;
}

export interface CreateCustomerParams {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  created: number;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: Stripe.Subscription.Status;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  items: {
    id: string;
    priceId: string;
    quantity: number;
  }[];
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;
  private readonly isDev: boolean;
  private readonly isEnabled: boolean;

  constructor() {
    const apiKey = process.env['STRIPE_SECRET_KEY'];
    this.isDev = process.env['NODE_ENV'] === 'development';
    this.isEnabled = !!apiKey;

    if (!apiKey) {
      this.stripe = null;
      this.logger.warn(
        '⚠️  Stripe is not configured (STRIPE_SECRET_KEY missing). Billing features will be disabled.',
      );
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });

    this.logger.log(
      `✅ Stripe initialized (${this.isDev ? 'DEV' : 'PROD'} mode)`,
    );
  }

  /**
   * Check if Stripe is properly configured
   */
  private checkStripeEnabled(): void {
    if (!this.isEnabled || !this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
      );
    }
  }

  /**
   * Returns whether Stripe is enabled and configured
   */
  isStripeEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Creates a new Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<StripeCustomer> {
    this.checkStripeEnabled();
    try {
      this.logger.log(`Creating customer: ${params.email}`);

      const customer = await this.stripe!.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata || {},
      });

      this.logger.log(`✅ Customer created: ${customer.id}`);

      return {
        id: customer.id,
        email: customer.email || '',
        name: customer.name || '',
        created: customer.created,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to create customer: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves a Stripe customer by ID
   */
  async getCustomer(customerId: string): Promise<StripeCustomer | null> {
    this.checkStripeEnabled();
    try {
      const customer = await this.stripe!.customers.retrieve(customerId);

      if (customer.deleted) {
        return null;
      }

      // Type narrowing: at this point we know it's a Customer, not DeletedCustomer
      return {
        id: customer.id,
        email: (customer as Stripe.Customer).email || '',
        name: (customer as Stripe.Customer).name || '',
        created: (customer as Stripe.Customer).created,
      };
    } catch (error) {
      const err = error as StripeError;
      if (err.code === 'resource_missing') {
        return null;
      }
      this.logger.error(`❌ Failed to get customer: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Updates a Stripe customer
   */
  async updateCustomer(
    customerId: string,
    params: Partial<CreateCustomerParams>,
  ): Promise<StripeCustomer> {
    this.checkStripeEnabled();
    try {
      const customer = await this.stripe!.customers.update(customerId, {
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });

      return {
        id: customer.id,
        email: customer.email || '',
        name: customer.name || '',
        created: customer.created,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to update customer: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Creates a subscription for a customer
   */
  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<StripeSubscription> {
    this.checkStripeEnabled();
    try {
      this.logger.log(
        `Creating subscription for customer: ${params.customerId}`,
      );

      const subscription = await this.stripe!.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      this.logger.log(`✅ Subscription created: ${subscription.id}`);

      return this.mapSubscription(subscription);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to create subscription: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves a subscription by ID
   */
  async getSubscription(
    subscriptionId: string,
  ): Promise<StripeSubscription | null> {
    this.checkStripeEnabled();
    try {
      const subscription =
        await this.stripe!.subscriptions.retrieve(subscriptionId);
      return this.mapSubscription(subscription);
    } catch (error) {
      const err = error as StripeError;
      if (err.code === 'resource_missing') {
        return null;
      }
      this.logger.error(
        `❌ Failed to get subscription: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Cancels a subscription
   * @param atPeriodEnd - If true, cancels at the end of the billing period
   */
  async cancelSubscription(
    subscriptionId: string,
    atPeriodEnd = true,
  ): Promise<StripeSubscription> {
    this.checkStripeEnabled();
    try {
      this.logger.log(
        `Canceling subscription: ${subscriptionId} (at period end: ${atPeriodEnd})`,
      );

      let subscription: Stripe.Subscription;

      if (atPeriodEnd) {
        subscription = await this.stripe!.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        subscription = await this.stripe!.subscriptions.cancel(subscriptionId);
      }

      this.logger.log(`✅ Subscription canceled: ${subscription.id}`);

      return this.mapSubscription(subscription);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to cancel subscription: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Resumes a subscription that was set to cancel at period end
   */
  async resumeSubscription(
    subscriptionId: string,
  ): Promise<StripeSubscription> {
    this.checkStripeEnabled();
    try {
      this.logger.log(`Resuming subscription: ${subscriptionId}`);

      const subscription = await this.stripe!.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      this.logger.log(`✅ Subscription resumed: ${subscription.id}`);

      return this.mapSubscription(subscription);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to resume subscription: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Creates a payment intent for one-time payments (e.g., credit top-up)
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<Stripe.PaymentIntent> {
    this.checkStripeEnabled();
    try {
      this.logger.log(
        `Creating payment intent: $${params.amount / 100} ${params.currency || 'USD'}`,
      );

      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: params.amount,
        currency: params.currency || 'usd',
        customer: params.customerId,
        metadata: params.metadata || {},
        automatic_payment_methods: { enabled: true },
      });

      this.logger.log(`✅ Payment intent created: ${paymentIntent.id}`);

      return paymentIntent;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to create payment intent: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves a payment intent by ID
   */
  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent | null> {
    this.checkStripeEnabled();
    try {
      const paymentIntent =
        await this.stripe!.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      const err = error as StripeError;
      if (err.code === 'resource_missing') {
        return null;
      }
      this.logger.error(
        `❌ Failed to get payment intent: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Creates a Stripe Checkout Session for subscription or one-time payment
   */
  async createCheckoutSession(params: {
    customerId?: string;
    priceId?: string;
    mode: 'subscription' | 'payment';
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    this.checkStripeEnabled();
    try {
      this.logger.log(`Creating checkout session (${params.mode})`);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: params.mode,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata || {},
      };

      if (params.customerId) {
        sessionParams.customer = params.customerId;
      }

      if (params.mode === 'subscription' && params.priceId) {
        sessionParams.line_items = [{ price: params.priceId, quantity: 1 }];
      }

      const session =
        await this.stripe!.checkout.sessions.create(sessionParams);

      this.logger.log(`✅ Checkout session created: ${session.id}`);

      return session;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to create checkout session: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Creates a billing portal session for customer to manage subscription
   */
  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    this.checkStripeEnabled();
    try {
      this.logger.log(
        `Creating billing portal session for customer: ${params.customerId}`,
      );

      const session = await this.stripe!.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      this.logger.log(`✅ Billing portal session created: ${session.id}`);

      return session;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to create billing portal session: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Constructs a webhook event from the request
   * @param payload - Raw request body
   * @param signature - Stripe signature header
   * @param secret - Webhook signing secret
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event {
    this.checkStripeEnabled();
    try {
      return this.stripe!.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Webhook signature verification failed: ${err.message}`,
      );
      throw error;
    }
  }

  /**
   * Helper to map Stripe subscription to our format
   */
  private mapSubscription(
    subscription: Stripe.Subscription,
  ): StripeSubscription {
    // Handle both snake_case (older API) and camelCase (newer API) property names
    const currentPeriodStart =
      'current_period_start' in subscription
        ? subscription.current_period_start
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (subscription as any).currentPeriodStart;
    const currentPeriodEnd =
      'current_period_end' in subscription
        ? subscription.current_period_end
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (subscription as any).currentPeriodEnd;
    const cancelAtPeriodEnd =
      'cancel_at_period_end' in subscription
        ? subscription.cancel_at_period_end
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (subscription as any).cancelAtPeriodEnd;

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd: cancelAtPeriodEnd,
      items: subscription.items.data.map((item) => ({
        id: item.id,
        priceId: item.price.id,
        quantity: item.quantity || 1,
      })),
    };
  }
}
