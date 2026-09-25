export type BillingPeriod = 'monthly' | 'annual';
export type Currency = 'PKR' | 'USD';
export type PaymentProvider =
  | 'jazzcash'
  | 'easypaisa'
  | 'card'
  | 'in_app_purchase';

export interface PlanPricing {
  period: BillingPeriod;
  currency: Currency;
  priceAmount: number;
  displayPrice: string;
  savingsNote?: string;
}

export interface SubscriptionState {
  isPaid: boolean;
  tier: 'free' | 'premium';
  period?: BillingPeriod;
  expiresAt?: string;
  provider?: PaymentProvider;
}

export const PRICING_TIERS: Record<Currency, Record<BillingPeriod, PlanPricing>> = {
  PKR: {
    monthly: {
      period: 'monthly',
      currency: 'PKR',
      priceAmount: 999,
      displayPrice: 'PKR 999 / month',
    },
    annual: {
      period: 'annual',
      currency: 'PKR',
      priceAmount: 6999,
      displayPrice: 'PKR 6,999 / year',
      savingsNote: 'Save 42% (PKR 583/mo)',
    },
  },
  USD: {
    monthly: {
      period: 'monthly',
      currency: 'USD',
      priceAmount: 6.99,
      displayPrice: '$6.99 / month',
    },
    annual: {
      period: 'annual',
      currency: 'USD',
      priceAmount: 49.99,
      displayPrice: '$49.99 / year',
      savingsNote: 'Save 40% ($4.16/mo)',
    },
  },
};
