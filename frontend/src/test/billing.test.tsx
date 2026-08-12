import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BillingDisabledBanner from '../components/billing/BillingDisabledBanner';
import EntitlementGate from '../components/billing/EntitlementGate';
import BillingDashboard from '../components/billing/BillingDashboard';
import AdminBillingCenter from '../components/billing/AdminBillingCenter';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/billing',
}));

const theme = createTheme();

describe('Billing Module Architecture Tests', () => {
  it('renders Billing Disabled banner proving platform is 100% free', () => {
    render(
      <ThemeProvider theme={theme}>
        <BillingDisabledBanner />
      </ThemeProvider>
    );
    expect(screen.getByText(/Kirmya is 100% Free/i)).toBeInTheDocument();
    expect(screen.getByText(/No credit card, subscription, or payment is required/i)).toBeInTheDocument();
  });

  it('renders EntitlementGate permitting child access freely', () => {
    render(
      <EntitlementGate feature="recruiter.advanced_search">
        <div>Protected Candidate Search</div>
      </EntitlementGate>
    );
    expect(screen.getByText(/Protected Candidate Search/i)).toBeInTheDocument();
  });

  it('renders Billing Dashboard with active Free Plan', () => {
    render(
      <ThemeProvider theme={theme}>
        <BillingDashboard />
      </ThemeProvider>
    );
    expect(screen.getByText(/Billing & Subscription Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Plan/i)).toBeInTheDocument();
  });

  it('renders Admin Billing Center displaying billing disabled status', () => {
    render(
      <ThemeProvider theme={theme}>
        <AdminBillingCenter />
      </ThemeProvider>
    );
    expect(screen.getByText(/Administrative Billing Control & Entitlements/i)).toBeInTheDocument();
    expect(screen.getByText(/Billing is currently disabled/i)).toBeInTheDocument();
  });
});
