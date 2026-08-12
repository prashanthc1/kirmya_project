import { BillingStatus, Plan, Entitlement } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const billingApi = {
  async getStatus(): Promise<BillingStatus> {
    try {
      const res = await fetch(`${API_BASE}/billing/status`);
      if (!res.ok) throw new Error('Failed to fetch billing status');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        billing_enabled: false,
        subscriptions_enabled: false,
        checkout_enabled: false,
        premium_features_enabled: false,
        stripe_enabled: false,
        message: 'Kirmya is 100% Free. Billing is disabled.',
      };
    }
  },

  async getPlans(): Promise<Plan[]> {
    try {
      const res = await fetch(`${API_BASE}/billing/plans`);
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      return data.data || [];
    } catch {
      return [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Free Plan',
          slug: 'free',
          description: 'Full platform access - 100% Free',
          plan_type: 'free',
          currency: 'USD',
          billing_interval: 'monthly',
          price_cents: 0,
          trial_period_days: 0,
          is_active: true,
          is_public: true,
        },
      ];
    }
  },

  async getEntitlements(): Promise<Entitlement[]> {
    try {
      const res = await fetch(`${API_BASE}/billing/entitlements`);
      if (!res.ok) throw new Error('Failed to fetch entitlements');
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  },
};
