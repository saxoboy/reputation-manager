import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export const PLAN_PRICES = {
  [PlanType.FREE]: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 50,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
  },
  [PlanType.STARTER]: {
    monthlyPrice: 3900, // $39.00 in cents
    yearlyPrice: 39000, // $390.00 in cents (1 month free)
    credits: 500,
    stripePriceIdMonthly: process.env['STRIPE_PRICE_STARTER_MONTHLY'],
    stripePriceIdYearly: process.env['STRIPE_PRICE_STARTER_YEARLY'],
  },
  [PlanType.PROFESSIONAL]: {
    monthlyPrice: 12900, // $129.00 in cents
    yearlyPrice: 129000, // $1,290.00 in cents (1 month free)
    credits: 2000,
    stripePriceIdMonthly: process.env['STRIPE_PRICE_PROFESSIONAL_MONTHLY'],
    stripePriceIdYearly: process.env['STRIPE_PRICE_PROFESSIONAL_YEARLY'],
  },
  [PlanType.ENTERPRISE]: {
    monthlyPrice: null,
    yearlyPrice: null,
    credits: -1, // Unlimited
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
  },
};

export const CREDIT_PACKAGES = {
  SMALL: {
    credits: 100,
    price: 1000, // $10.00
    pricePerCredit: 0.1,
  },
  MEDIUM: {
    credits: 500,
    price: 4500, // $45.00 (10% discount)
    pricePerCredit: 0.09,
  },
  LARGE: {
    credits: 1000,
    price: 8000, // $80.00 (20% discount)
    pricePerCredit: 0.08,
  },
  XLARGE: {
    credits: 5000,
    price: 35000, // $350.00 (30% discount)
    pricePerCredit: 0.07,
  },
};

export class CreateSubscriptionDto {
  @IsEnum(PlanType)
  plan: PlanType;

  @IsEnum(['monthly', 'yearly'])
  interval: 'monthly' | 'yearly';

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsEnum(['immediate', 'period_end'])
  when?: 'immediate' | 'period_end' = 'period_end';
}

export class PurchaseCreditsDto {
  @IsInt()
  @Min(1)
  credits: number;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class BillingInfoDto {
  plan: PlanType;
  messageCredits: number;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  hasPaymentMethod: boolean;
}

export class CreateCheckoutSessionDto {
  @IsEnum(['subscription', 'credits'])
  type: 'subscription' | 'credits';

  @IsOptional()
  @IsEnum(PlanType)
  plan?: PlanType;

  @IsOptional()
  @IsEnum(['monthly', 'yearly'])
  interval?: 'monthly' | 'yearly';

  @IsOptional()
  @IsInt()
  @Min(1)
  credits?: number;

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}
