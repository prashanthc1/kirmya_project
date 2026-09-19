import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import RecruiterOffersPage from '../app/recruiter/offers/page';
import { atsApi } from '../features/ats/api';
import type { JobOfferDTO } from '../features/ats/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/recruiter/offers',
}));

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'recruiter-1', email: 'recruiter@kirmya.invalid', name: 'Recruiter User' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
    authenticated: true,
    isAuthenticated: true,
    status: 'authenticated' as const,
    loading: false,
    permissions: [],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'recruiter-1', email: 'recruiter@kirmya.invalid', name: 'Recruiter User' },
    authenticated: true,
    isAuthenticated: true,
    status: 'authenticated' as const,
    loading: false,
  }),
}));

vi.mock('../components/recruiter/RecruiterCapabilityGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RecruiterCapabilityGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../features/recruiter/api', () => ({
  recruiterApi: {
    getCapability: vi.fn().mockResolvedValue({
      capabilityStatus: 'active',
      onboardingRequired: false,
      profile: {},
    }),
    getOffers: vi.fn(),
    getJobOffers: vi.fn(),
  },
}));

vi.mock('../features/ats/api', () => ({
  atsApi: {
    getJobOffers: vi.fn(),
  },
}));

const theme = createTheme();

describe('RecruiterOffersPage (Job Offers & Contracts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders honest empty state when no offers exist, without inventing candidates', async () => {
    vi.mocked(atsApi.getJobOffers).mockResolvedValueOnce([]);

    render(
      <ThemeProvider theme={theme}>
        <RecruiterOffersPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No job offers issued yet/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/To make an offer, open a candidate's application/i)
    ).toBeInTheDocument();
    // Must never render fabricated candidates
    expect(screen.queryByText(/Sarah Chen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tariq Al-Mansoor/i)).not.toBeInTheDocument();
  });

  it('displays error message when API call fails rather than rendering fallbacks', async () => {
    vi.mocked(atsApi.getJobOffers).mockRejectedValueOnce(new Error('Network error'));

    render(
      <ThemeProvider theme={theme}>
        <RecruiterOffersPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Offers could not be loaded/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Sarah Chen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tariq Al-Mansoor/i)).not.toBeInTheDocument();
  });

  it('renders real offers from API with correct candidate and contract details', async () => {
    const realOffers: JobOfferDTO[] = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        applicationId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        jobId: '22222222-3333-4444-5555-666666666666',
        candidateId: 'cccccccc-dddd-eeee-ffff-000000000000',
        candidateName: 'Alex Mercer',
        recruiterId: 'dddddddd-eeee-ffff-0000-111111111111',
        positionTitle: 'Staff Backend Architect',
        salary: '140,000 USD',
        currency: 'USD',
        benefits: 'Health, Dental, Remote stipend',
        joiningDate: '2026-11-01',
        contractType: 'Full-time',
        status: 'Sent',
        createdAt: '2026-09-18T10:00:00Z',
        expiresAt: '2026-10-02T10:00:00Z',
      },
    ];

    vi.mocked(atsApi.getJobOffers).mockResolvedValueOnce(realOffers);

    render(
      <ThemeProvider theme={theme}>
        <RecruiterOffersPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
    });

    expect(screen.getByText('Staff Backend Architect')).toBeInTheDocument();
    expect(screen.getByText(/140,000 USD/)).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.queryByText(/Sarah Chen/i)).not.toBeInTheDocument();
  });
});
