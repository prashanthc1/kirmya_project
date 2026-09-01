import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import NetworkStats from '../components/network/NetworkStats';
import PeopleResultCard from '../components/network/PeopleResultCard';
import ConnectionRequestDialog from '../components/network/ConnectionRequestDialog';
import ConnectionCard from '../components/network/ConnectionCard';
import RecommendationCard from '../components/network/RecommendationCard';
import ConnectionNoteModal from '../components/network/ConnectionNoteModal';
import NetworkingGoalsCard from '../components/network/NetworkingGoalsCard';
import ReferralDiscoveryCard from '../components/network/ReferralDiscoveryCard';
import PeopleFilters from '../components/network/PeopleFilters';

import MyNetworkDashboardPage from '../app/network/page';
import NetworkConnectionsPage from '../app/network/connections/page';
import PendingRequestsPage from '../app/network/requests/page';
import NetworkSuggestionsPage from '../app/network/suggestions/page';
import NetworkSearchPage from '../app/network/search/page';
import { networkingApi } from '../features/networking/services/networkingApi';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/network',
  useParams: () => ({}),
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/network') {
        return Promise.resolve({
          data: {
            totalConnections: 140,
            pendingReceived: 1,
            pendingSent: 1,
            networkGrowthThisMonth: 12,
            profileViews: 380,
            searchAppearances: 1250,
            goalProgress: { totalGoals: 2, completedGoals: 1, targetConnectionsCount: 25 },
          },
        });
      }
      if (url === '/network/connections') {
        return Promise.resolve({
          data: [
            {
              userId: 'u1',
              username: 'ayeshas',
              name: 'Ayesha Siddiqui',
              headline: 'Senior Frontend Architect',
              location: 'Dubai, UAE',
              industry: 'Technology',
              company: 'Kirmya Tech',
              mutualCount: 5,
              connectionStatus: 'connected',
              isFollowing: true,
              notes: [],
              labels: ['Tech'],
            },
          ],
        });
      }
      if (url.includes('/search')) {
        return Promise.resolve({
          data: [
            {
              id: 'res-1',
              userId: 'u1',
              username: 'ayeshas',
              name: 'Ayesha Siddiqui',
              headline: 'Next.js Frontend Architect',
              company: 'Kirmya Tech',
              location: 'Abu Dhabi, UAE',
              industry: 'Technology',
              connectionStatus: 'none',
              mutualCount: 2,
              openToWork: true,
              skills: ['React', 'Next.js'],
            },
          ],
        });
      }
      if (url.includes('/notes')) {
        return Promise.resolve({
          data: [{ id: 'note-1', connectionId: 'conn-10', text: 'Great candidate', labels: ['VIP'] }],
        });
      }
      if (url.includes('/goals')) {
        return Promise.resolve({
          data: [{ id: 'g-1', title: 'Connect 5 Engineers', targetCount: 5, currentCount: 2, completed: false }],
        });
      }
      if (url.includes('/referrals') || url.includes('/company')) {
        return Promise.resolve({
          data: [{ userId: 'u1', name: 'Ayesha Siddiqui', company: 'Kirmya', role: 'Staff Engineer' }],
        });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn().mockImplementation((url: string, body?: any) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          data: { id: 'note-new', connectionId: body?.connectionId || 'conn-10', text: body?.text || 'Great candidate', labels: body?.labels || ['VIP'] },
        });
      }
      if (url.includes('/goals')) {
        return Promise.resolve({
          data: { id: 'g-new', title: body?.title || 'Connect 5 Engineers', targetCount: body?.targetCount || 5, completed: false },
        });
      }
      return Promise.resolve({ data: { message: 'Success' } });
    }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  getAccessToken: () => 'mock-jwt-token',
}));

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'u1', email: 'test@kirmya.com', name: 'Test User' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
    authenticated: true,
    isAuthenticated: true,
    loading: false,
    permissions: [],
    login: vi.fn(),
    logout: vi.fn(),
    refreshAuth: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

describe('Kirmya Networking & Connection Management Suite', () => {
  const mockPerson: any = {
    id: 'res-1',
    userId: 'u1',
    username: 'ayeshas',
    name: 'Ayesha Siddiqui',
    headline: 'Next.js Frontend Architect',
    location: 'Abu Dhabi, UAE',
    industry: 'Technology',
    connectionStatus: 'none',
    mutualCount: 2,
    openToWork: true,
    skills: ['React', 'Next.js'],
  };

  const mockRecommendation: any = {
    userId: 'rec-1',
    username: 'sarahc',
    name: 'Sarah Chen',
    headline: 'Principal AI Researcher',
    location: 'Dubai, UAE',
    industry: 'AI Research',
    mutualCount: 5,
    matchScore: 94,
    reason: 'Shared 5 mutual connections',
    connectionStatus: 'none',
  };

  const mockConnection: any = {
    userId: 'conn-10',
    username: 'marcusv',
    name: 'Marcus Vance',
    headline: 'Backend Lead',
    location: 'Dubai',
    industry: 'Cloud Engineering',
    labels: ['Tech', 'VIP'],
    notes: [{ text: 'Met at Dubai Tech Summit' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Client Methods', () => {
    it('fetches network growth stats', async () => {
      const stats = await networkingApi.getNetworkStats();
      expect(stats.totalConnections).toBeGreaterThan(0);
      expect(stats.profileViews).toBeDefined();
    });

    it('searches people with filter query', async () => {
      const results = await networkingApi.searchPeople({ query: 'Ayesha' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Ayesha');
    });

    it('manages connection notes and labels', async () => {
      const note = await networkingApi.saveConnectionNote('conn-10', 'Great candidate', ['VIP']);
      expect(note.text).toBe('Great candidate');
      const notes = await networkingApi.getConnectionNotes('conn-10');
      expect(notes.length).toBeGreaterThan(0);
    });

    it('manages networking goals', async () => {
      const goals = await networkingApi.getNetworkingGoals();
      expect(Array.isArray(goals)).toBe(true);
      const newGoal = await networkingApi.createNetworkingGoal({ title: 'Connect 5 Engineers', targetCount: 5 });
      expect(newGoal.title).toBe('Connect 5 Engineers');
    });

    it('fetches company referral connections', async () => {
      const companies = await networkingApi.getCompanyConnections('Kirmya');
      expect(Array.isArray(companies)).toBe(true);
    });
  });

  describe('UI Component Unit Tests', () => {
    it('renders NetworkStats overview and goal progress', () => {
      render(<NetworkStats />);
      expect(screen.getByText(/Your Network Overview & Growth Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Connections/i)).toBeInTheDocument();
      expect(screen.getByText(/Growth \(30d\)/i)).toBeInTheDocument();
    });

    it('renders PeopleResultCard with tags and connect trigger', () => {
      render(<PeopleResultCard person={mockPerson} />);
      expect(screen.getByText(/Ayesha Siddiqui/i)).toBeInTheDocument();
      expect(screen.getByText(/Open to work/i)).toBeInTheDocument();
      expect(screen.getByText(/2 mutual/i)).toBeInTheDocument();
      expect(screen.getByText(/Connect/i)).toBeInTheDocument();
    });

    it('renders ConnectionRequestDialog modal and character count', () => {
      render(
        <ConnectionRequestDialog
          open={true}
          targetName="Ayesha Siddiqui"
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );
      expect(screen.getByText(/Connect with Ayesha Siddiqui/i)).toBeInTheDocument();
      expect(screen.getByText(/Send Invitation/i)).toBeInTheDocument();
      expect(screen.getByText(/0\/300/i)).toBeInTheDocument();
    });

    it('renders RecommendationCard with mutual connections', () => {
      render(<RecommendationCard cand={mockRecommendation} />);
      expect(screen.getByText(/Sarah Chen/i)).toBeInTheDocument();
      expect(screen.getAllByText(/5 mutual/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders ConnectionCard with notes & action buttons', () => {
      render(<ConnectionCard connection={mockConnection} />);
      expect(screen.getByText(/Marcus Vance/i)).toBeInTheDocument();
      expect(screen.getByText(/Message/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Tech/i).length).toBeGreaterThan(0);
    });

    it('renders ConnectionNoteModal for note editing', () => {
      render(
        <ConnectionNoteModal
          open={true}
          connectionId="conn-10"
          connectionName="Marcus Vance"
          initialNote="Follow up next month"
          initialLabels={['VIP']}
          onClose={() => {}}
        />
      );
      expect(screen.getByText(/Private Note & Labels \(Marcus Vance\)/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Follow up next month/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Note & Labels/i)).toBeInTheDocument();
    });

    it('renders NetworkingGoalsCard widget', () => {
      render(<NetworkingGoalsCard />);
      expect(screen.getByText(/Networking Goals & Growth Targets/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Goal/i)).toBeInTheDocument();
    });

    it('renders ReferralDiscoveryCard widget', () => {
      render(<ReferralDiscoveryCard />);
      expect(screen.getByText(/Company Referral Finder/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter company name/i)).toBeInTheDocument();
    });

    it('renders PeopleFilters sidebar', () => {
      render(<PeopleFilters filters={{}} onChange={() => {}} onReset={() => {}} />);
      expect(screen.getByText(/Discovery Filters/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role \/ Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Company/i)).toBeInTheDocument();
    });
  });

  describe('Page Component Integration Tests', () => {
    it('renders main dashboard page', async () => {
      render(<MyNetworkDashboardPage />);
      expect(screen.getAllByText(/Professional Network/i).length).toBeGreaterThan(0);
    });

    it('renders connections page', async () => {
      render(<NetworkConnectionsPage />);
      expect(screen.getAllByText(/1st-Degree Connections/i).length).toBeGreaterThan(0);
    });

    it('renders pending requests page with tabs', async () => {
      render(<PendingRequestsPage />);
      expect(screen.getAllByText(/Connection Invitations/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Received/i)).toBeInTheDocument();
      expect(screen.getByText(/Sent/i)).toBeInTheDocument();
    });

    it('renders suggestions page', async () => {
      render(<NetworkSuggestionsPage />);
      expect(screen.getAllByText(/Recommended For You/i).length).toBeGreaterThan(0);
    });

    it('renders search page', async () => {
      render(<NetworkSearchPage />);
      expect(screen.getAllByText(/Search Network & Professionals/i).length).toBeGreaterThan(0);
    });
  });
});
