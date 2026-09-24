import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/*
 * The freelancer's payouts screen and the administrator's payout queue,
 * against a mocked API. What these pin: the freelancer is sent to the
 * processor's own onboarding and never asked for bank details here, a return
 * from onboarding asks the processor where the account stands, and only a
 * failed payout is offered for retry.
 */

const search = vi.hoisted(() => ({ params: '' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search.params),
  usePathname: () => '/freelance/payouts',
}));

vi.mock('../features/freelance/api', () => ({
  freelanceApi: {
    getPayoutAccount: vi.fn(),
    listPayouts: vi.fn(),
    startPayoutOnboarding: vi.fn(),
    refreshPayoutAccount: vi.fn(),
  },
  freelanceAdminApi: {
    listPayouts: vi.fn(),
    retryPayout: vi.fn(),
  },
}));

import { freelanceApi, freelanceAdminApi } from '../features/freelance/api';
import type { AdminPayout, Payout, PayoutAccountView } from '../features/freelance/types';
import PayoutsView from '../components/freelance/PayoutsView';
import PayoutQueue from '../components/admin/freelance/PayoutQueue';

const api = vi.mocked(freelanceApi);
const adminApi = vi.mocked(freelanceAdminApi);

function account(overrides: Partial<PayoutAccountView> = {}): PayoutAccountView {
  return { available: true, status: 'not_started', waiting: {}, ...overrides };
}

function payout(overrides: Partial<AdminPayout> = {}): AdminPayout {
  return {
    id: 'payout-1',
    contract_id: 'contract-1',
    payee_id: 'freelancer-1',
    amount: 600,
    currency: 'AED',
    status: 'pending',
    attempts: 0,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function page<T>(data: T[]) {
  return { page: 1, limit: 20, total_items: data.length, total_pages: 1, data };
}

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const assign = vi.fn();
const realLocation = window.location;

beforeEach(() => {
  vi.clearAllMocks();
  search.params = '';
  api.listPayouts.mockResolvedValue(page<Payout>([]));
  Object.defineProperty(window, 'location', { configurable: true, value: { ...realLocation, assign } });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

describe('payouts screen', () => {
  it('sends a freelancer with no account to the processor\'s onboarding', async () => {
    api.getPayoutAccount.mockResolvedValue(account({ waiting: { AED: 600 } }));
    api.startPayoutOnboarding.mockResolvedValue({
      url: 'https://connect.stripe.com/setup/e/acct_1/x',
      account: account({ status: 'onboarding' }),
    });
    renderWithQuery(<PayoutsView />);

    expect(await screen.findByText(/waiting to be sent: aed\s*600\.00/i)).toBeInTheDocument();
    // No bank details are asked for here: the processor collects them.
    expect(screen.queryByLabelText(/iban|account number/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /set up payouts/i }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://connect.stripe.com/setup/e/acct_1/x'));
  });

  it('offers to continue an unfinished setup', async () => {
    api.getPayoutAccount.mockResolvedValue(account({ status: 'action_required' }));
    renderWithQuery(<PayoutsView />);

    expect(await screen.findByRole('button', { name: /continue setup/i })).toBeInTheDocument();
    expect(screen.getByText(/needs more information/i)).toBeInTheDocument();
  });

  it('asks the processor where the account stands on return from onboarding', async () => {
    search.params = 'onboarding=return';
    api.getPayoutAccount.mockResolvedValue(account({ status: 'onboarding' }));
    api.refreshPayoutAccount.mockResolvedValue(account({ status: 'enabled' }));
    renderWithQuery(<PayoutsView />);

    expect(await screen.findByText(/payouts are set up/i)).toBeInTheDocument();
    expect(api.refreshPayoutAccount).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /set up payouts|continue setup/i })).not.toBeInTheDocument();
  });

  it('says so when a setup link expired', async () => {
    search.params = 'onboarding=refresh';
    api.getPayoutAccount.mockResolvedValue(account({ status: 'onboarding' }));
    renderWithQuery(<PayoutsView />);

    expect(await screen.findByText(/setup link expired/i)).toBeInTheDocument();
    expect(api.refreshPayoutAccount).not.toHaveBeenCalled();
  });

  it('explains a refusal to somebody who is not a freelancer', async () => {
    api.getPayoutAccount.mockResolvedValue(account());
    api.startPayoutOnboarding.mockRejectedValue({ response: { status: 403, data: { error: 'Forbidden' } } });
    renderWithQuery(<PayoutsView />);

    fireEvent.click(await screen.findByRole('button', { name: /set up payouts/i }));
    expect(await screen.findByText(/payouts are for freelancers/i)).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it('says payouts are unavailable rather than offering setup', async () => {
    api.getPayoutAccount.mockResolvedValue(account({ available: false }));
    renderWithQuery(<PayoutsView />);

    expect(await screen.findByText(/payouts are not available yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /set up payouts/i })).not.toBeInTheDocument();
  });

  it('lists payouts with where each stands', async () => {
    api.getPayoutAccount.mockResolvedValue(account({ status: 'enabled' }));
    api.listPayouts.mockResolvedValue(page<Payout>([
      payout({ id: 'p-paid', status: 'paid', paid_at: '2026-09-03T00:00:00Z' }),
      payout({ id: 'p-wait', status: 'pending', amount: 400 }),
    ]));
    renderWithQuery(<PayoutsView />);

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Sent')).toBeInTheDocument();
    expect(within(table).getByText('Waiting to be sent')).toBeInTheDocument();
    expect(within(table).getAllByRole('link', { name: /view contract/i })[0]).toHaveAttribute('href', '/freelance/contracts/contract-1');
  });
});

describe('admin payout queue', () => {
  it('shows failed payouts with their reason and retries one', async () => {
    adminApi.listPayouts.mockResolvedValue(page([
      payout({ status: 'failed', attempts: 5, last_error: 'stripe: 400 balance_insufficient' }),
    ]));
    adminApi.retryPayout.mockResolvedValue(payout({ status: 'pending' }));
    renderWithQuery(<PayoutQueue />);

    expect(await screen.findByText(/balance_insufficient/)).toBeInTheDocument();
    expect(adminApi.listPayouts).toHaveBeenCalledWith('failed', 1, 20);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => expect(adminApi.retryPayout).toHaveBeenCalledWith('payout-1'));
    expect(await screen.findByText(/back in the queue/i)).toBeInTheDocument();
  });

  it('offers retry only on a failed payout', async () => {
    adminApi.listPayouts.mockResolvedValue(page([payout({ status: 'paid' }), payout({ id: 'p-2', status: 'pending' })]));
    renderWithQuery(<PayoutQueue />);

    await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
