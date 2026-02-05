import { apiClient } from '../lib/api-client';

export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface BillingInfo {
  plan: PlanType;
  messageCredits: number;
  subscriptionStatus?: string;
  subscriptionPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  hasPaymentMethod: boolean;
}

export interface PlanDetails {
  plan: string;
  name: string;
  price: number;
  priceYearly: number;
  credits: number;
  maxUsers: number;
  maxPractices: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface CreditPackage {
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
}

export interface Transaction {
  id: string;
  type:
    | 'SUBSCRIPTION_PAYMENT'
    | 'CREDIT_PURCHASE'
    | 'REFUND'
    | 'CREDIT_ADJUSTMENT';
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  amount: number;
  currency: string;
  creditsAdded: number;
  description?: string;
  createdAt: string;
}

export interface CreateSubscriptionDto {
  plan: PlanType;
  interval: 'monthly' | 'yearly';
  successUrl?: string;
  cancelUrl?: string;
}

export interface PurchaseCreditsDto {
  credits: number;
}

export interface CancelSubscriptionDto {
  when: 'now' | 'period_end';
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface BillingPortalResponse {
  url: string;
}

export const billingService = {
  /**
   * Get current billing information
   */
  async getBillingInfo(workspaceId: string): Promise<BillingInfo> {
    return apiClient.get<BillingInfo>(`/workspaces/${workspaceId}/billing`);
  },

  /**
   * Get available plans
   */
  async getAvailablePlans(workspaceId: string): Promise<PlanDetails[]> {
    return apiClient.get<PlanDetails[]>(
      `/workspaces/${workspaceId}/billing/plans`,
    );
  },

  /**
   * Get available credit packages
   */
  async getAvailableCreditPackages(
    workspaceId: string,
  ): Promise<CreditPackage[]> {
    return apiClient.get<CreditPackage[]>(
      `/workspaces/${workspaceId}/billing/credit-packages`,
    );
  },

  /**
   * Create subscription checkout session
   */
  async createSubscription(
    workspaceId: string,
    data: CreateSubscriptionDto,
  ): Promise<CheckoutResponse> {
    return apiClient.post<CheckoutResponse>(
      `/workspaces/${workspaceId}/billing/subscribe`,
      data,
    );
  },

  /**
   * Purchase credits
   */
  async purchaseCredits(
    workspaceId: string,
    data: PurchaseCreditsDto,
  ): Promise<CheckoutResponse> {
    return apiClient.post<CheckoutResponse>(
      `/workspaces/${workspaceId}/billing/credits`,
      data,
    );
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    workspaceId: string,
    data: CancelSubscriptionDto,
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(
      `/workspaces/${workspaceId}/billing/cancel`,
      data,
    );
  },

  /**
   * Resume subscription
   */
  async resumeSubscription(
    workspaceId: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(
      `/workspaces/${workspaceId}/billing/resume`,
    );
  },

  /**
   * Get billing portal URL
   */
  async getBillingPortal(workspaceId: string): Promise<BillingPortalResponse> {
    return apiClient.get<BillingPortalResponse>(
      `/workspaces/${workspaceId}/billing/portal`,
    );
  },

  /**
   * Get transaction history
   */
  async getTransactions(workspaceId: string): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>(
      `/workspaces/${workspaceId}/billing/transactions`,
    );
  },
};
