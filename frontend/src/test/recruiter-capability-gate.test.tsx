/*
 * The recruiter capability gate.
 *
 * These assert what the user is shown, not what they are allowed to do. The
 * server refuses every privileged /recruiter/* route with 403 regardless of
 * what renders here; the backend suite in backend/test/ci covers that. What is
 * worth pinning down is that an unonboarded account is sent to onboarding
 * rather than left staring at an empty dashboard, that a suspended one is not
 * offered onboarding as a remedy, and - the failure mode that matters most -
 * that a lookup error is never reported as a denial.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockReplace = vi.fn();
let currentPath = '/recruiter/dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => currentPath,
  useSearchParams: () => new URLSearchParams(''),
}));

const mockGetCapability = vi.fn();
vi.mock('../features/recruiter/api', () => ({
  recruiterApi: {
    getCapability: () => mockGetCapability(),
  },
}));

import RecruiterCapabilityGate from '../components/recruiter/RecruiterCapabilityGate';

const Protected = () => <div>Pipeline board</div>;

describe('RecruiterCapabilityGate', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockGetCapability.mockReset();
    currentPath = '/recruiter/dashboard';
  });

  it('renders recruiter content for an active capability', async () => {
    mockGetCapability.mockResolvedValue({
      capabilityStatus: 'active',
      onboardingRequired: false,
      profile: {},
    });

    render(
      <RecruiterCapabilityGate>
        <Protected />
      </RecruiterCapabilityGate>
    );

    expect(await screen.findByText('Pipeline board')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it.each(['none', 'pending'])('sends a %s account to onboarding', async (status) => {
    mockGetCapability.mockResolvedValue({
      capabilityStatus: status,
      onboardingRequired: true,
      profile: null,
    });

    render(
      <RecruiterCapabilityGate>
        <Protected />
      </RecruiterCapabilityGate>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/recruiter/onboarding'));
    expect(screen.queryByText('Pipeline board')).not.toBeInTheDocument();
  });

  it('tells a suspended account that onboarding will not help, and does not redirect', async () => {
    mockGetCapability.mockResolvedValue({
      capabilityStatus: 'suspended',
      onboardingRequired: false,
      profile: null,
    });

    render(
      <RecruiterCapabilityGate>
        <Protected />
      </RecruiterCapabilityGate>
    );

    expect(await screen.findByText('Recruiting access disabled')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByText('Pipeline board')).not.toBeInTheDocument();
  });

  it('does not treat a failed lookup as a denial', async () => {
    mockGetCapability.mockRejectedValue(new Error('network down'));

    render(
      <RecruiterCapabilityGate>
        <Protected />
      </RecruiterCapabilityGate>
    );

    expect(await screen.findByText(/could not confirm your recruiting access/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('never gates the onboarding route itself', async () => {
    currentPath = '/recruiter/onboarding';

    render(
      <RecruiterCapabilityGate>
        <Protected />
      </RecruiterCapabilityGate>
    );

    expect(await screen.findByText('Pipeline board')).toBeInTheDocument();
    expect(mockGetCapability).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
