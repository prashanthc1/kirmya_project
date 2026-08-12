export interface BillingStatus {
  billing_enabled: boolean;
  subscriptions_enabled: boolean;
  checkout_enabled: boolean;
  premium_features_enabled: boolean;
  stripe_enabled: boolean;
  message: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  plan_type: string;
  currency: string;
  billing_interval: string;
  price_cents: number;
  trial_period_days: number;
  is_active: boolean;
  is_public: boolean;
  features?: Record<string, any>;
  limits?: Record<string, any>;
}

export interface Entitlement {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  subtotal_cents: number;
  total_cents: number;
  currency: string;
  status: string;
  paid_at?: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}
