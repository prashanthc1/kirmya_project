import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/*
 * The administrative freelance screens name the people and projects behind a
 * dispute or a payout, rather than showing ids a person working the queue
 * cannot act on.
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/admin/freelance/disputes',
}));

vi.mock('../features/freelance/api', () => ({
  freelanceApi: {},
  freelanceAdminApi: {
    listDisputes: vi.fn(),
    getDispute: vi.fn(),
    resolveDispute: vi.fn(),
    listPayouts: vi.fn(),
    retryPayout: vi.fn(),
  },
}));

import { freelanceAdminApi } from '../features/freelance/api';
import type { AdminDispute, AdminDisputeDetail, AdminPayout, ContractSummary } from '../features/freelance/types';
import DisputeQueue from '../components/admin/freelance/DisputeQueue';
import DisputeDecision from '../components/admin/freelance/DisputeDecision';
import PayoutQueue from '../components/admin/freelance/PayoutQueue';
import { personLabel } from '../components/freelance/escrowFormat';

const adminApi = vi.mocked(freelanceAdminApi);

const contract: ContractSummary = {
  id: 'contract-1',
  project_title: 'Payments dashboard',
  client: { id: 'client-1', name: 'Amira Haddad', email: 'amira@example.invalid' },
  freelancer: { id: 'freelancer-1', name: 'Rohan Mehta', email: 'rohan@example.invalid' },
};

function dispute(overrides: Partial<AdminDisputeDetail> = {}): AdminDisputeDetail {
  return {
    id: 'd-1',
    contract_id: 'contract-1',
    milestone_id: 'm-1',
    raised_by: 'client-1',
    reason: 'quality',
    detail: 'The pages do not match the designs.',
    status: 'open',
    created_at: '2026-09-02T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
    evidence: [
      { id: 'e-1', dispute_id: 'd-1', uploaded_by: 'freelancer-1', kind: 'note', body: 'They were approved.', created_at: '2026-09-03T00:00:00Z' },
      { id: 'e-2', dispute_id: 'd-1', uploaded_by: 'client-1', kind: 'note', body: 'Not these ones.', created_at: '2026-09-04T00:00:00Z' },
    ],
    contract,
    raised_by_person: contract.client,
    ...overrides,
  };
}

function page<T>(data: T[]) {
  return { page: 1, limit: 20, total_items: data.length, total_pages: 1, data };
}

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe('dispute queue', () => {
  it('names the project and both parties instead of the contract id', async () => {
    adminApi.listDisputes.mockResolvedValue(page<AdminDispute>([dispute()]));
    renderWithQuery(<DisputeQueue />);

    const row = (await screen.findByText('Payments dashboard')).closest('tr')!;
    expect(within(row).getByText('Amira Haddad')).toBeInTheDocument();
    expect(within(row).getByText('Rohan Mehta')).toBeInTheDocument();
    expect(within(row).queryByText(/contract-1|contract-/)).not.toBeInTheDocument();
  });
});

describe('dispute decision', () => {
  it('names the parties, the raiser and the author of each piece of evidence', async () => {
    adminApi.getDispute.mockResolvedValue(dispute());
    renderWithQuery(<DisputeDecision disputeID="d-1" />);

    expect(await screen.findByText(/Payments dashboard · opened .* by Amira Haddad \(the client\)/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'amira@example.invalid' })).toHaveAttribute('href', 'mailto:amira@example.invalid');
    expect(screen.getByRole('link', { name: 'rohan@example.invalid' })).toBeInTheDocument();
    expect(screen.getByText(/Rohan Mehta \(freelancer\)/)).toBeInTheDocument();
    expect(screen.getByText(/Amira Haddad \(client\) · raised the dispute/)).toBeInTheDocument();
    expect(screen.queryByText(/raised by user/)).not.toBeInTheDocument();
  });

  it('still reads sensibly when no names came back', async () => {
    adminApi.getDispute.mockResolvedValue(dispute({ contract: undefined, raised_by_person: undefined }));
    renderWithQuery(<DisputeDecision disputeID="d-1" />);

    expect(await screen.findByText(/Untitled project · opened .* by Account client-1/)).toBeInTheDocument();
  });
});

describe('payout queue', () => {
  it('names the payee and the project', async () => {
    const payout: AdminPayout = {
      id: 'p-1',
      contract_id: 'contract-1',
      payee_id: 'freelancer-1',
      amount: 600,
      currency: 'AED',
      status: 'failed',
      attempts: 5,
      last_error: 'stripe: 400 balance_insufficient',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
      payee: contract.freelancer,
      project_title: 'Payments dashboard',
    };
    adminApi.listPayouts.mockResolvedValue(page([payout]));
    renderWithQuery(<PayoutQueue />);

    const row = (await screen.findByText('Rohan Mehta')).closest('tr')!;
    expect(within(row).getByText('rohan@example.invalid')).toBeInTheDocument();
    expect(within(row).getByText('Payments dashboard')).toBeInTheDocument();
  });
});

describe('personLabel', () => {
  it('prefers the name, then the email, then the start of the id', () => {
    expect(personLabel({ id: 'u-1234567890', name: ' Amira Haddad ', email: 'a@example.invalid' })).toBe('Amira Haddad');
    expect(personLabel({ id: 'u-1234567890', name: '', email: 'a@example.invalid' })).toBe('a@example.invalid');
    expect(personLabel({ id: 'u-1234567890', name: '', email: '' })).toBe('Account u-123456');
    expect(personLabel(undefined, 'abcdef0123')).toBe('Account abcdef01');
    expect(personLabel(undefined)).toBe('Unknown account');
  });
});
