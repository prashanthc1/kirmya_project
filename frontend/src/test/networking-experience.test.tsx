import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { PeopleResultCard } from '../components/network/PeopleResultCard';
import { ConnectionCard } from '../components/network/ConnectionCard';
import { RecommendationCard } from '../components/network/RecommendationCard';
import { ConnectionActionButton } from '../components/network/ConnectionActionButton';
import { PeopleSearchBar } from '../components/network/PeopleSearchBar';
import { PeopleFilters } from '../components/network/PeopleFilters';
import { BlockUserModal } from '../components/network/BlockUserModal';
import { ReportUserModal } from '../components/network/ReportUserModal';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/people',
}));

const mockSendRequest = vi.fn().mockResolvedValue({});
const mockAcceptRequest = vi.fn().mockResolvedValue({});
const mockDeclineRequest = vi.fn().mockResolvedValue({});
const mockWithdrawRequest = vi.fn().mockResolvedValue({});
const mockRemoveConnection = vi.fn().mockResolvedValue({});
const mockBlockUser = vi.fn().mockResolvedValue({});
const mockUnblockUser = vi.fn().mockResolvedValue({});
const mockReportUser = vi.fn().mockResolvedValue({});
const mockDismissRecommendation = vi.fn().mockResolvedValue({});

vi.mock('../features/networking/services/networkingApi', () => ({
  networkingApi: {
    sendRequest: (...args: any[]) => mockSendRequest(...args),
    acceptRequest: (...args: any[]) => mockAcceptRequest(...args),
    declineRequest: (...args: any[]) => mockDeclineRequest(...args),
    withdrawRequest: (...args: any[]) => mockWithdrawRequest(...args),
    removeConnection: (...args: any[]) => mockRemoveConnection(...args),
    blockUser: (...args: any[]) => mockBlockUser(...args),
    unblockUser: (...args: any[]) => mockUnblockUser(...args),
    reportUser: (...args: any[]) => mockReportUser(...args),
    dismissRecommendation: (...args: any[]) => mockDismissRecommendation(...args),
    searchPeople: vi.fn().mockResolvedValue([]),
    getSuggestions: vi.fn().mockResolvedValue([]),
    listConnections: vi.fn().mockResolvedValue([]),
    listIncomingRequests: vi.fn().mockResolvedValue([]),
    listSentRequests: vi.fn().mockResolvedValue([]),
    getNetworkStats: vi.fn().mockResolvedValue({
      totalConnections: 10,
      pendingReceived: 2,
      pendingSent: 1,
    }),
  },
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Networking, People Discovery & Connections Experience (Prompt 19/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PeopleResultCard Component', () => {
    const mockPerson = {
      id: 'res-1',
      userId: 'u-101',
      username: 'janesmith',
      name: 'Jane Smith',
      avatarUrl: '',
      headline: 'Principal Cloud Architect',
      currentPosition: 'Cloud Architect @ TechCorp',
      company: 'TechCorp Global',
      location: 'Dubai, UAE',
      industry: 'Technology',
      openToWork: true,
      mutualCount: 4,
      mutualConnections: ['Alex Rivera'],
      connectionStatus: 'none' as const,
      verificationStatus: 'verified',
    };

    it('renders person identity, verification badge, headline, and connect button', () => {
      renderWithTheme(<PeopleResultCard person={mockPerson} />);
      expect(screen.getByText('Jane Smith')).toBeDefined();
      expect(screen.getByText('Principal Cloud Architect')).toBeDefined();
      expect(screen.getByText('TechCorp Global')).toBeDefined();
      expect(screen.getByText('4 mutual')).toBeDefined();
      expect(screen.getByText('Open to work')).toBeDefined();
      expect(screen.getByRole('button', { name: /Connect with Jane Smith/i })).toBeDefined();
    });
  });

  describe('ConnectionActionButton State Transitions', () => {
    it('renders Connect button when status is none', () => {
      renderWithTheme(
        <ConnectionActionButton
          userId="u-101"
          userName="Jane Smith"
          initialStatus="none"
        />
      );
      expect(screen.getByRole('button', { name: /Connect with Jane Smith/i })).toBeDefined();
    });

    it('renders Pending state with withdraw button when status is pending_sent', () => {
      renderWithTheme(
        <ConnectionActionButton
          userId="u-101"
          userName="Jane Smith"
          initialStatus="pending_sent"
          requestId="req-123"
        />
      );
      expect(screen.getByText(/Pending/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Withdraw connection request to Jane Smith/i })).toBeDefined();
    });

    it('renders Accept and Decline buttons when status is pending_received', () => {
      renderWithTheme(
        <ConnectionActionButton
          userId="u-101"
          userName="Jane Smith"
          initialStatus="pending_received"
          requestId="req-123"
        />
      );
      expect(screen.getByRole('button', { name: /Accept connection from Jane Smith/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Decline connection from Jane Smith/i })).toBeDefined();
    });

    it('renders Message button when status is connected', () => {
      renderWithTheme(
        <ConnectionActionButton
          userId="u-101"
          userName="Jane Smith"
          initialStatus="connected"
        />
      );
      expect(screen.getByRole('link', { name: /Message Jane Smith/i })).toBeDefined();
    });
  });

  describe('ConnectionCard Component', () => {
    const mockConnection = {
      id: 'conn-1',
      userId: 'u-102',
      username: 'marcus_v',
      name: 'Marcus Vance',
      avatarUrl: '',
      headline: 'Staff Go Backend Engineer',
      location: 'Abu Dhabi, UAE',
      industry: 'Cloud Infrastructure',
      company: 'Hyperscale AI',
      mutualCount: 12,
    };

    it('renders connection identity, company, location, and message action', () => {
      renderWithTheme(<ConnectionCard connection={mockConnection} />);
      expect(screen.getByText('Marcus Vance')).toBeDefined();
      expect(screen.getByText('Staff Go Backend Engineer')).toBeDefined();
      expect(screen.getByText('Hyperscale AI')).toBeDefined();
      expect(screen.getByText('Abu Dhabi, UAE')).toBeDefined();
      expect(screen.getByRole('link', { name: /Message/i })).toBeDefined();
    });
  });

  describe('RecommendationCard Component', () => {
    const mockRecommendation = {
      userId: 'u-103',
      username: 'sarah_c',
      name: 'Sarah Chen',
      avatarUrl: '',
      headline: 'AI Research Director',
      location: 'Dubai, UAE',
      industry: 'Artificial Intelligence',
      currentCompany: 'DataGen Labs',
      mutualCount: 8,
      matchScore: 95,
      reason: '8 Mutual Connections in AI',
      connectionStatus: 'none',
    };

    it('renders recommendation reason pill and dismiss button', () => {
      renderWithTheme(<RecommendationCard cand={mockRecommendation} />);
      expect(screen.getByText('Sarah Chen')).toBeDefined();
      expect(screen.getByText('8 Mutual Connections in AI')).toBeDefined();
      expect(screen.getByRole('button', { name: /Dismiss recommendation/i })).toBeDefined();
    });
  });

  describe('PeopleSearchBar Component', () => {
    it('handles query typing and debounces search input', async () => {
      const mockSearch = vi.fn();
      renderWithTheme(<PeopleSearchBar onSearch={mockSearch} />);
      const input = screen.getByLabelText(/Search professionals/i);
      fireEvent.change(input, { target: { value: 'Frontend Lead' } });

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith('Frontend Lead');
      });
    });
  });

  describe('PeopleFilters Component', () => {
    it('renders filter controls and triggers change callback', () => {
      const mockChange = vi.fn();
      const mockReset = vi.fn();
      renderWithTheme(
        <PeopleFilters
          filters={{ role: 'Engineer', location: 'Dubai' }}
          onChange={mockChange}
          onReset={mockReset}
        />
      );
      expect(screen.getByLabelText(/Role \/ Title/i)).toBeDefined();
      expect(screen.getByLabelText(/Location/i)).toBeDefined();
      expect(screen.getByText(/Reset Filters/i)).toBeDefined();

      fireEvent.click(screen.getByText(/Reset Filters/i));
      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('BlockUserModal Component', () => {
    it('renders block confirmation warning and calls block API', async () => {
      const mockClose = vi.fn();
      const mockBlocked = vi.fn();
      renderWithTheme(
        <BlockUserModal
          open={true}
          userId="u-101"
          userName="Bad Actor"
          onClose={mockClose}
          onBlocked={mockBlocked}
        />
      );
      expect(screen.getByText(/Block Bad Actor\?/i)).toBeDefined();
      const blockBtn = screen.getByRole('button', { name: /Block User/i });
      fireEvent.click(blockBtn);

      await waitFor(() => {
        expect(mockBlockUser).toHaveBeenCalledWith('u-101');
      });
    });
  });

  describe('ReportUserModal Component', () => {
    it('renders report reason selector and submits abuse report', async () => {
      const mockClose = vi.fn();
      renderWithTheme(
        <ReportUserModal
          open={true}
          userId="u-101"
          userName="Spam User"
          onClose={mockClose}
        />
      );
      expect(screen.getByText(/Report Spam User/i)).toBeDefined();
      const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockReportUser).toHaveBeenCalledWith('u-101', 'spam_harassment', '');
      });
    });
  });
});
