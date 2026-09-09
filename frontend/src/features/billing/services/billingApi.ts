import { BillingStatus, Plan, Entitlement } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const billingApi = {
  async getStatus(): Promise<BillingStatus> {
    const res = await fetch(`${API_BASE}/billing/status`);
    if (!res.ok) throw new Error('Failed to fetch billing status');
    const data = await res.json();
    return data.data;
    
  },

  async getPlans(): Promise<Plan[]> {
    const res = await fetch(`${API_BASE}/billing/plans`);
    if (!res.ok) throw new Error('Failed to fetch plans');
    const data = await res.json();
    return data.data || [];
    
  },

  async getEntitlements(): Promise<Entitlement[]> {
    const res = await fetch(`${API_BASE}/billing/entitlements`);
    if (!res.ok) throw new Error('Failed to fetch entitlements');
    const data = await res.json();
    return data.data || [];
    
  },
};
