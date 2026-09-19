import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from './utils';
import ProfileCompletionCard from '../components/onboarding/ProfileCompletionCard';
import SkipResumeDialog from '../components/onboarding/SkipResumeDialog';
import AdminOnboardingDashboard from '../components/admin/onboarding/AdminOnboardingDashboard';
import ConnectionsStep from '../components/onboarding/ConnectionsStep';
import CommunitiesStep from '../components/onboarding/CommunitiesStep';
import { onboardingApi } from '../features/onboarding/api';
import { networkingApi } from '../features/networking/services/networkingApi';

vi.mock('../features/onboarding/api', () => ({
  onboardingApi: {
    getRecommendedConnections: vi.fn(),
    getRecommendedCommunities: vi.fn(),
  },
}));

vi.mock('../features/networking/services/networkingApi', () => ({
  networkingApi: {
    sendRequest: vi.fn(),
  },
}));

describe('Onboarding & First-Time User Experience Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProfileCompletionCard widget with score and suggestions', () => {
    renderWithProviders(<ProfileCompletionCard />);
    expect(screen.getByText(/Profile Completion Strength/i)).toBeInTheDocument();
    expect(screen.getByText(/85% Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommended Profile Improvements/i)).toBeInTheDocument();
  });

  it('renders SkipResumeDialog modal controls', () => {
    renderWithProviders(<SkipResumeDialog open={true} onClose={() => {}} onSkip={() => {}} onFinishLater={() => {}} />);
    expect(screen.getByText(/Skip Step or Finish Later\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Skip Optional Step/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Save & Finish Later/i)).toBeInTheDocument();
  });

  it('renders AdminOnboardingDashboard funnel metrics', () => {
    renderWithProviders(<AdminOnboardingDashboard />);
    expect(screen.getByText(/Executive Onboarding Control & Funnel Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Started/i)).toBeInTheDocument();
    expect(screen.getAllByText(/87.3%/i).length).toBeGreaterThan(0);
  });

  describe('ConnectionsStep', () => {
    it('shows empty UI with honest single sentence when API returns empty list', async () => {
      vi.mocked(onboardingApi.getRecommendedConnections).mockResolvedValue([]);

      renderWithProviders(<ConnectionsStep onNext={vi.fn()} onPrev={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByText(/No suggestions yet\. As more people join, you will see them here\./i)
        ).toBeInTheDocument();
      });

      expect(screen.queryByText(/Stripe/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
    });

    it('renders real connections returned by API and handles connect click', async () => {
      vi.mocked(onboardingApi.getRecommendedConnections).mockResolvedValue([
        {
          id: 'user-rec-1',
          name: 'Nadia Karim',
          title: 'Senior Recruiter',
          company: 'Careem',
          role_type: 'Recruiter',
          avatar_url: '',
          is_connected: false,
        },
      ]);
      vi.mocked(networkingApi.sendRequest).mockResolvedValue({ message: 'Request sent' } as any);

      renderWithProviders(<ConnectionsStep onNext={vi.fn()} onPrev={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Nadia Karim')).toBeInTheDocument();
      });
      expect(screen.getByText(/Senior Recruiter at Careem/i)).toBeInTheDocument();

      const connectBtn = screen.getByRole('button', { name: /^Connect$/i });
      fireEvent.click(connectBtn);

      await waitFor(() => {
        expect(networkingApi.sendRequest).toHaveBeenCalledWith('user-rec-1');
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Connected$/i })).toBeInTheDocument();
      });
    });

    it('handles navigation via back, skip, and continue buttons', async () => {
      vi.mocked(onboardingApi.getRecommendedConnections).mockResolvedValue([]);
      const onNext = vi.fn();
      const onPrev = vi.fn();

      renderWithProviders(<ConnectionsStep onNext={onNext} onPrev={onPrev} />);

      await waitFor(() => {
        expect(screen.getByText(/No suggestions yet/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
      expect(onPrev).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /^Skip$/i }));
      expect(onNext).toHaveBeenCalledWith();

      fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
      expect(onNext).toHaveBeenCalledWith({ connections: [] });
    });

    it('displays error message when suggestions fail to load', async () => {
      vi.mocked(onboardingApi.getRecommendedConnections).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ConnectionsStep onNext={vi.fn()} onPrev={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Suggestions could not be loaded\. You can skip this and connect with people later\./i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('CommunitiesStep', () => {
    it('shows empty UI with honest single sentence when API returns empty list', async () => {
      vi.mocked(onboardingApi.getRecommendedCommunities).mockResolvedValue([]);

      renderWithProviders(<CommunitiesStep onNext={vi.fn()} onPrev={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByText(/No recommended communities yet\. As new guilds are created, you will see them here\./i)
        ).toBeInTheDocument();
      });

      expect(screen.queryByText(/14,200 members/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Facilities & Operations Guild/i)).not.toBeInTheDocument();
    });

    it('renders real communities and toggles joined state', async () => {
      vi.mocked(onboardingApi.getRecommendedCommunities).mockResolvedValue([
        {
          id: 'comm-101',
          name: 'Cloud Infrastructure Architects',
          category: 'Engineering',
          member_count: 58,
          is_joined: false,
        },
      ]);

      renderWithProviders(<CommunitiesStep onNext={vi.fn()} onPrev={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Infrastructure Architects')).toBeInTheDocument();
      });
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('58 members')).toBeInTheDocument();

      const joinBtn = screen.getByRole('button', { name: /Join Guild/i });
      fireEvent.click(joinBtn);
      expect(screen.getByRole('button', { name: /Joined/i })).toBeInTheDocument();
    });

    it('handles navigation via back, skip, and continue buttons', async () => {
      vi.mocked(onboardingApi.getRecommendedCommunities).mockResolvedValue([]);
      const onNext = vi.fn();
      const onPrev = vi.fn();

      renderWithProviders(<CommunitiesStep onNext={onNext} onPrev={onPrev} />);

      await waitFor(() => {
        expect(screen.getByText(/No recommended communities yet/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
      expect(onPrev).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /^Skip$/i }));
      expect(onNext).toHaveBeenCalledWith();

      fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
      expect(onNext).toHaveBeenCalledWith({ joinedCommunities: [] });
    });
  });
});

