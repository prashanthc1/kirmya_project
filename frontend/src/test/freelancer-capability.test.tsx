/*
 * The freelancer entry point.
 *
 * Freelancer capability is something an account acquires deliberately, so the
 * marketplace page has to render for somebody who does not hold it. Two things
 * are worth pinning down: that such an account is offered the way in rather
 * than controls that answer 403, and that the workspace switcher is not that
 * way in - it lists workspaces the account has, and an opportunity to acquire
 * one is not a workspace.
 *
 * Nothing here is evidence that anything is protected. The server refuses a
 * proposal from an account without an active capability; this only checks that
 * the client stops offering it.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/freelance',
  useSearchParams: () => new URLSearchParams(''),
}));

const getProjects = vi.fn();
const getContracts = vi.fn();
const getOnboardingStatus = vi.fn();
vi.mock('../features/freelance/api', () => ({
  freelanceApi: {
    getProjects: (...args: unknown[]) => getProjects(...args),
    getContracts: (...args: unknown[]) => getContracts(...args),
    getOnboardingStatus: (...args: unknown[]) => getOnboardingStatus(...args),
  },
  default: {},
}));

import FreelanceMarketplacePage from '../app/freelance/page';

const project = {
  id: 'p1',
  client_id: 'c1',
  title: 'Index tuning',
  description: 'Audit the migrations',
  budget: 3000,
  budget_type: 'fixed' as const,
  skills_required: ['Go'],
  status: 'open' as const,
  proposals_count: 4,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  getProjects.mockResolvedValue({ data: [project], count: 1 });
  getContracts.mockResolvedValue({ data: [], count: 0 });
});

describe('freelancer entry point', () => {
  it('offers a professional the way in, and does not offer to send proposals', async () => {
    getOnboardingStatus.mockResolvedValue({ capability: 'none' });
    render(<FreelanceMarketplacePage />);

    const cta = await screen.findByRole('link', { name: /become a freelancer/i });
    expect(cta).toHaveAttribute('href', '/freelance/onboarding');

    // The project is still browsable - discovery is how somebody decides to
    // become a freelancer - but the proposal control is not offered.
    expect(await screen.findByText('Index tuning')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit proposal/i })).not.toBeInTheDocument();
  });

  it('tells a half-finished account to continue rather than start again', async () => {
    getOnboardingStatus.mockResolvedValue({ capability: 'pending', missing: ['skills'] });
    render(<FreelanceMarketplacePage />);

    const cta = await screen.findByRole('link', { name: /continue setup/i });
    expect(cta).toHaveAttribute('href', '/freelance/onboarding');
    expect(screen.queryByRole('button', { name: /submit proposal/i })).not.toBeInTheDocument();
  });

  it('tells a suspended account what is suspended, and offers no way to undo it', async () => {
    getOnboardingStatus.mockResolvedValue({ capability: 'suspended' });
    render(<FreelanceMarketplacePage />);

    // Says which thing is suspended: the account is not.
    expect(await screen.findByText(/freelancing is suspended/i)).toBeInTheDocument();
    expect(screen.getByText(/kirmya account, profile and history are unaffected/i)).toBeInTheDocument();

    // Onboarding is not a way back in, so it is not offered.
    expect(screen.queryByRole('link', { name: /become a freelancer|continue setup/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit proposal/i })).not.toBeInTheDocument();
  });

  it('offers the proposal control once the capability is active, and stops nagging', async () => {
    getOnboardingStatus.mockResolvedValue({ capability: 'active' });
    render(<FreelanceMarketplacePage />);

    expect(await screen.findByRole('button', { name: /submit proposal/i })).toBeEnabled();
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /become a freelancer/i })).not.toBeInTheDocument();
    });
  });
});
