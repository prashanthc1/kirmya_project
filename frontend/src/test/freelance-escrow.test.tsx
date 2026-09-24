import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/*
 * The freelance contract, dispute and admin decision screens, against a mocked
 * API. What these pin is what each person is offered: the server refuses the
 * wrong party anyway, but a button that exists only to fail is a defect too -
 * and a funding request must never be shown as money received.
 */

const auth = vi.hoisted(() => ({ userID: 'client-1' }));
const search = vi.hoisted(() => ({ params: '' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search.params),
  usePathname: () => '/freelance/contracts/contract-1',
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: auth.userID, email: 'someone@kirmya.invalid' },
    authenticated: true,
    isAuthenticated: true,
    status: 'authenticated' as const,
    loading: false,
  }),
}));

vi.mock('../features/freelance/api', () => ({
  freelanceApi: {
    getContract: vi.fn(),
    listContractDisputes: vi.fn(),
    addMilestone: vi.fn(),
    cancelMilestone: vi.fn(),
    fundMilestone: vi.fn(),
    submitMilestone: vi.fn(),
    requestRevision: vi.fn(),
    approveMilestone: vi.fn(),
    refundMilestone: vi.fn(),
    openDispute: vi.fn(),
    getDispute: vi.fn(),
    addEvidence: vi.fn(),
    withdrawDispute: vi.fn(),
    getPayoutAccount: vi.fn(),
  },
  freelanceAdminApi: {
    listDisputes: vi.fn(),
    getDispute: vi.fn(),
    resolveDispute: vi.fn(),
  },
}));

import { freelanceApi, freelanceAdminApi } from '../features/freelance/api';
import type { ContractDetail, ContractMilestone, DisputeDetail } from '../features/freelance/types';
import ContractView from '../components/freelance/ContractView';
import DisputeView from '../components/freelance/DisputeView';
import DisputeDecision from '../components/admin/freelance/DisputeDecision';

const api = vi.mocked(freelanceApi);
const adminApi = vi.mocked(freelanceAdminApi);

function milestone(overrides: Partial<ContractMilestone>): ContractMilestone {
  return {
    id: 'm-1',
    contract_id: 'contract-1',
    position: 0,
    title: 'Design',
    amount: 600,
    currency: 'AED',
    status: 'pending',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function contract(milestones: ContractMilestone[], overrides: Partial<ContractDetail> = {}): ContractDetail {
  return {
    id: 'contract-1',
    project_id: 'project-1',
    proposal_id: 'proposal-1',
    project_title: 'Payments dashboard',
    client_id: 'client-1',
    freelancer_id: 'freelancer-1',
    total_amount: 1000,
    currency: 'AED',
    status: 'active',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    milestones,
    escrow: { currency: 'AED', contract_total: 1000, allocated: 600, unallocated: 400, in_escrow: 0, released: 0 },
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.userID = 'client-1';
  search.params = '';
  api.listContractDisputes.mockResolvedValue({ data: [], count: 0 });
  api.getPayoutAccount.mockResolvedValue({ available: true, status: 'enabled', waiting: {} });
});

describe('contract screen', () => {
  it('offers the client funding and cancellation on an unfunded milestone, and nothing the freelancer does', async () => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'pending' })]));
    renderWithQuery(<ContractView contractID="contract-1" />);

    const row = await screen.findByTestId('milestone-m-1');
    expect(within(row).getByRole('button', { name: /fund aed/i })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /submit work/i })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /refund/i })).not.toBeInTheDocument();
    // Nothing is in escrow yet, so there is nothing to dispute.
    expect(within(row).queryByRole('button', { name: /open dispute/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add milestone/i })).toBeInTheDocument();
  });

  it('offers the freelancer delivery and refund on a funded milestone, and never approval', async () => {
    auth.userID = 'freelancer-1';
    api.getContract.mockResolvedValue(contract([milestone({ status: 'funded' })]));
    renderWithQuery(<ContractView contractID="contract-1" />);

    const row = await screen.findByTestId('milestone-m-1');
    expect(within(row).getByRole('button', { name: /submit work/i })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /refund client/i })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /open dispute/i })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /^fund /i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add milestone/i })).not.toBeInTheDocument();
  });

  it('offers the client review on submitted work', async () => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'submitted' })]));
    renderWithQuery(<ContractView contractID="contract-1" />);

    const row = await screen.findByTestId('milestone-m-1');
    expect(within(row).getByRole('button', { name: /approve and release/i })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /request changes/i })).toBeInTheDocument();
  });

  it('tells the client a funding request is not yet a payment', async () => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'pending' })]));
    api.fundMilestone.mockResolvedValue({
      payment_intent: {
        id: 'pi-1',
        contract_id: 'contract-1',
        amount: 600,
        currency: 'AED',
        status: 'requires_payment',
        created_at: '2026-09-01T00:00:00Z',
      },
    });
    renderWithQuery(<ContractView contractID="contract-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /fund aed/i }));
    expect(await screen.findByText(/will show as funded once the payment is confirmed/i)).toBeInTheDocument();
    expect(api.fundMilestone).toHaveBeenCalledWith('contract-1', 'm-1');
  });

  it('says plainly when payments are not available', async () => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'pending' })]));
    api.fundMilestone.mockRejectedValue({
      response: { status: 503, data: { code: 'FREELANCE_PAYMENTS_UNAVAILABLE' } },
    });
    renderWithQuery(<ContractView contractID="contract-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /fund aed/i }));
    expect(await screen.findByText(/payments are not available yet/i)).toBeInTheDocument();
  });

  it('shows escrow totals in the contract currency, to the fil', async () => {
    api.getContract.mockResolvedValue(
      contract([milestone({ status: 'funded', amount: 600.5 })], {
        escrow: { currency: 'AED', contract_total: 1000, allocated: 600.5, unallocated: 399.5, in_escrow: 600.5, released: 0 },
      })
    );
    renderWithQuery(<ContractView contractID="contract-1" />);
    expect(await screen.findAllByText(/AED\s?600\.50/)).not.toHaveLength(0);
    expect(screen.getByText(/AED\s?399\.50/)).toBeInTheDocument();
  });

  it('refuses a milestone larger than what is left to schedule, before asking the server', async () => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'pending' })]));
    renderWithQuery(<ContractView contractID="contract-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /add milestone/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/title/i), { target: { value: 'Build' } });
    fireEvent.change(within(dialog).getByLabelText(/amount/i), { target: { value: '500' } });
    expect(within(dialog).getByText(/only aed\s?400\.00 of the contract is left/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /add milestone/i })).toBeDisabled();
    expect(api.addMilestone).not.toHaveBeenCalled();
  });

  it('tells a client back from checkout where the payment stands', async () => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'pending' })]));
    search.params = 'payment=cancelled';
    const { unmount } = renderWithQuery(<ContractView contractID="contract-1" />);
    expect(await screen.findByText(/payment cancelled\. nothing was charged/i)).toBeInTheDocument();
    unmount();

    search.params = 'payment=success';
    renderWithQuery(<ContractView contractID="contract-1" />);
    expect(await screen.findByText(/payment received\. the milestone will show as funded/i)).toBeInTheDocument();
  });

  it('shows a stranger that the contract cannot be found', async () => {
    auth.userID = 'stranger';
    api.getContract.mockRejectedValue({ response: { status: 404, data: { error: 'Not found' } } });
    renderWithQuery(<ContractView contractID="contract-1" />);
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument();
  });
});

function dispute(overrides: Partial<DisputeDetail> = {}): DisputeDetail {
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
    milestone: milestone({ status: 'disputed' }),
    evidence: [
      {
        id: 'e-1',
        dispute_id: 'd-1',
        uploaded_by: 'freelancer-1',
        kind: 'link',
        body: '',
        file_url: 'https://example.com/approved',
        created_at: '2026-09-03T00:00:00Z',
      },
    ],
    ...overrides,
  };
}

describe('contract screen: payouts', () => {
  it('tells the freelancer to set up payouts until their account is enabled', async () => {
    auth.userID = 'freelancer-1';
    api.getPayoutAccount.mockResolvedValue({ available: true, status: 'not_started', waiting: { AED: 600 } });
    api.getContract.mockResolvedValue(contract([milestone({ status: 'released' })]));
    renderWithQuery(<ContractView contractID="contract-1" />);

    const link = await screen.findByRole('link', { name: /set up payouts/i });
    expect(link).toHaveAttribute('href', '/freelance/payouts');
  });

  it('says nothing about payouts once the account is enabled', async () => {
    auth.userID = 'freelancer-1';
    api.getContract.mockResolvedValue(contract([milestone({ status: 'released' })]));
    renderWithQuery(<ContractView contractID="contract-1" />);

    await screen.findByTestId('milestone-m-1');
    await waitFor(() => expect(api.getPayoutAccount).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: /set up payouts/i })).not.toBeInTheDocument();
  });

  it('never asks about the client\'s payout account', async () => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'released' })]));
    renderWithQuery(<ContractView contractID="contract-1" />);

    await screen.findByTestId('milestone-m-1');
    expect(api.getPayoutAccount).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: /set up payouts/i })).not.toBeInTheDocument();
  });
});

describe('dispute screen', () => {
  beforeEach(() => {
    api.getContract.mockResolvedValue(contract([milestone({ status: 'disputed' })]));
  });

  it('lets the raiser withdraw, and labels evidence by party', async () => {
    api.getDispute.mockResolvedValue(dispute());
    renderWithQuery(<DisputeView disputeID="d-1" />);

    expect(await screen.findByRole('button', { name: /withdraw dispute/i })).toBeInTheDocument();
    expect(await screen.findByText(/the freelancer ·/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://example.com/approved' })).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('does not offer the other party the withdrawal', async () => {
    auth.userID = 'freelancer-1';
    api.getDispute.mockResolvedValue(dispute());
    renderWithQuery(<DisputeView disputeID="d-1" />);

    expect(await screen.findByText(/add evidence/i, { selector: 'h6' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw dispute/i })).not.toBeInTheDocument();
  });

  it('shows the decision and closes evidence once resolved', async () => {
    api.getDispute.mockResolvedValue(
      dispute({ status: 'resolved', outcome: 'refund_to_client', resolution: 'Nothing matching the brief was delivered.' })
    );
    renderWithQuery(<DisputeView disputeID="d-1" />);

    expect(await screen.findByText(/decision: refund the client/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing matching the brief/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add evidence/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw dispute/i })).not.toBeInTheDocument();
  });
});

describe('admin dispute decision', () => {
  it('needs an outcome and a written resolution, then a confirmation, before deciding', async () => {
    adminApi.getDispute.mockResolvedValue(dispute());
    adminApi.resolveDispute.mockResolvedValue({ ...dispute(), status: 'resolved' });
    renderWithQuery(<DisputeDecision disputeID="d-1" />);

    const record = await screen.findByRole('button', { name: /record decision/i });
    expect(record).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/refund the client/i));
    expect(record).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/resolution/i), { target: { value: 'Not delivered as agreed.' } });
    fireEvent.click(record);

    // The confirmation says what happens to the money, and nothing is sent yet.
    expect(await screen.findByText(/will be refunded to the client/i)).toBeInTheDocument();
    expect(adminApi.resolveDispute).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /confirm decision/i }));
    await waitFor(() =>
      expect(adminApi.resolveDispute).toHaveBeenCalledWith('d-1', {
        outcome: 'refund_to_client',
        resolution: 'Not delivered as agreed.',
      })
    );
  });
});
