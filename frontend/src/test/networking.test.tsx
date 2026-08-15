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
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/network',
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
      expect(screen.getByText(/#OpenToWork/i)).toBeInTheDocument();
      expect(screen.getByText(/2 Mutuals/i)).toBeInTheDocument();
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
      expect(screen.getByText(/0\/500/i)).toBeInTheDocument();
    });

    it('renders RecommendationCard with match score', () => {
      render(<RecommendationCard cand={mockRecommendation} />);
      expect(screen.getByText(/Sarah Chen/i)).toBeInTheDocument();
      expect(screen.getByText(/94% Match/i)).toBeInTheDocument();
      expect(screen.getByText(/Shared 5 mutual connections/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Search & Discovery Filters/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role \/ Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Company/i)).toBeInTheDocument();
    });
  });

  describe('Page Component Integration Tests', () => {
    it('renders main dashboard page', async () => {
      render(<MyNetworkDashboardPage />);
      expect(screen.getByText(/My Professional Network/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Suggested Connection Recommendations/i)).toBeInTheDocument();
      });
    });

    it('renders connections page', async () => {
      render(<NetworkConnectionsPage />);
      expect(screen.getByText(/1st-Degree Connections/i)).toBeInTheDocument();
    });

    it('renders pending requests page with tabs', async () => {
      render(<PendingRequestsPage />);
      expect(screen.getByText(/Pending Network Invitations/i)).toBeInTheDocument();
      expect(screen.getByText(/Received/i)).toBeInTheDocument();
      expect(screen.getByText(/Sent/i)).toBeInTheDocument();
    });

    it('renders suggestions page', async () => {
      render(<NetworkSuggestionsPage />);
      expect(screen.getByText(/People You May Know & AI Recommendations/i)).toBeInTheDocument();
    });

    it('renders search page', async () => {
      render(<NetworkSearchPage />);
      expect(screen.getByText(/Discover & Search Professional Members/i)).toBeInTheDocument();
    });
  });
});
