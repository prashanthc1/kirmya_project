import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { communityApi } from '../features/community/services/communityApi';
import { CommunityCard } from '../components/community/CommunityCard';
import { CommunityHeader } from '../components/community/CommunityHeader';
import { CommunityCreateModal } from '../components/community/CommunityCreateModal';
import { CommunityFeed } from '../components/community/CommunityFeed';
import { CommunityMemberDirectory } from '../components/community/CommunityMemberDirectory';
import { CommunityEventsCard } from '../components/community/CommunityEventsCard';
import { CommunityResourcesCard } from '../components/community/CommunityResourcesCard';
import { CommunityModerationDesk } from '../components/community/CommunityModerationDesk';
import { CommunitySettingsTab } from '../components/community/CommunitySettingsTab';

// App Router Pages
import CommunitiesDiscoveryPage from '../app/communities/page';
import CreateCommunityPage from '../app/communities/create/page';
import CommunityHubPage from '../app/communities/[id]/page';
import CommunityMembersPage from '../app/communities/[id]/members/page';
import CommunityAboutPage from '../app/communities/[id]/about/page';
import CommunitySettingsPage from '../app/communities/[id]/settings/page';
import CommunityModerationPage from '../app/communities/[id]/moderation/page';
import CommunityEventsPage from '../app/communities/[id]/events/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/communities/comm-1',
  useParams: () => ({ id: 'comm-1' }),
}));

const theme = createTheme();
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('Kirmya Community, Groups & Knowledge Collaboration Suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </QueryClientProvider>
    );
  };

  describe('TASK 1: Community API Client', () => {
    it('lists communities with optional filters', async () => {
      const comms = await communityApi.listCommunities();
      expect(comms).toBeDefined();
      expect(comms.length).toBeGreaterThan(0);
      expect(comms[0]).toHaveProperty('title');
    });

    it('fetches community by ID', async () => {
      const comm = await communityApi.getCommunity('comm-1');
      expect(comm).toBeDefined();
      expect(comm.id).toBe('comm-1');
    });

    it('creates and updates a community', async () => {
      const newComm = await communityApi.createCommunity({
        title: 'Quantum Systems Engineering',
        description: 'Testing quantum circuit architecture',
        category: 'Engineering & Cloud',
      });
      expect(newComm).toBeDefined();
      expect(newComm.title).toBe('Quantum Systems Engineering');

      const updated = await communityApi.updateCommunity(newComm.id, {
        description: 'Updated description',
      });
      expect(updated.description).toBe('Updated description');
    });

    it('handles join and leave actions', async () => {
      const joinRes = await communityApi.joinCommunity('comm-1');
      expect(joinRes.success).toBe(true);

      const leaveRes = await communityApi.leaveCommunity('comm-1');
      expect(leaveRes.success).toBe(true);
    });

    it('manages posts, pins, locks, and comments', async () => {
      const posts = await communityApi.getPosts('comm-1');
      expect(Array.isArray(posts)).toBe(true);

      const createdPost = await communityApi.createPost('comm-1', {
        title: 'Test Architecture Post',
        content: 'Content detailing zero-trust network topology',
      });
      expect(createdPost.title).toBe('Test Architecture Post');

      const pinRes = await communityApi.pinPost('comm-1', createdPost.id, true);
      expect(pinRes.success).toBe(true);

      const lockRes = await communityApi.lockPost('comm-1', createdPost.id, true);
      expect(lockRes.success).toBe(true);

      const likeRes = await communityApi.likePost('comm-1', createdPost.id);
      expect(likeRes.success).toBe(true);

      const comment = await communityApi.addComment('comm-1', createdPost.id, 'Great insight!');
      expect(comment.content).toBe('Great insight!');

      const comments = await communityApi.getComments('comm-1', createdPost.id);
      expect(comments.length).toBeGreaterThan(0);
    });

    it('manages events and RSVPs', async () => {
      const events = await communityApi.getEvents('comm-1');
      expect(Array.isArray(events)).toBe(true);

      const newEvent = await communityApi.createEvent('comm-1', {
        title: 'Live Q&A Workshop',
        description: 'Hands-on live demo',
        startDate: new Date().toISOString(),
      });
      expect(newEvent.title).toBe('Live Q&A Workshop');

      const rsvp = await communityApi.rsvpEvent('comm-1', newEvent.id, 'attending');
      expect(rsvp.success).toBe(true);
      expect(rsvp.userRsvp).toBe('attending');
    });

    it('manages shared resources', async () => {
      const resList = await communityApi.getResources('comm-1');
      expect(Array.isArray(resList)).toBe(true);

      const newRes = await communityApi.createResource('comm-1', {
        title: 'Cloud Security Blueprint',
        url: 'https://kirmya.io/blueprint.pdf',
        category: 'document',
      });
      expect(newRes.title).toBe('Cloud Security Blueprint');
    });

    it('manages moderation actions, reports, and invites', async () => {
      const reportRes = await communityApi.reportContent('comm-1', 'post-101', 'post', 'Spam content');
      expect(reportRes.success).toBe(true);

      const modActions = await communityApi.getModerationActions('comm-1');
      expect(Array.isArray(modActions)).toBe(true);

      const invite = await communityApi.sendInvite('comm-1', 'newmember@test.com', 'member');
      expect(invite.email).toBe('newmember@test.com');
    });
  });

  describe('TASK 2: Community UI Components', () => {
    const sampleCommunity = {
      id: 'comm-1',
      title: 'Cloud & DevOps Architects',
      description: 'A global community of Cloud Native engineers.',
      category: 'Engineering & Cloud',
      location: 'Remote',
      isPrivate: false,
      memberCount: 1500,
      postCount: 400,
      rules: ['Rule 1', 'Rule 2'],
      topics: ['Kubernetes', 'AWS', 'CI/CD'],
      postingPermission: 'all' as const,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'owner' as const,
      isMember: true,
    };

    it('renders CommunityCard and responds to join toggle', () => {
      const handleJoinToggle = vi.fn();
      renderWithProviders(
        <CommunityCard community={sampleCommunity} onJoinToggle={handleJoinToggle} />
      );

      expect(screen.getByText('Cloud & DevOps Architects')).toBeInTheDocument();
      expect(screen.getByText('#Kubernetes')).toBeInTheDocument();
      const joinBtn = screen.getByText('Joined');
      fireEvent.click(joinBtn);
      expect(handleJoinToggle).toHaveBeenCalledWith('comm-1', false);
    });

    it('renders CommunityHeader with banner and rules modal toggle', () => {
      renderWithProviders(<CommunityHeader community={sampleCommunity} />);

      expect(screen.getByText('Cloud & DevOps Architects')).toBeInTheDocument();
      expect(screen.getByText(/1,500 Members/i)).toBeInTheDocument();

      const rulesBtn = screen.getByText('Rules');
      fireEvent.click(rulesBtn);
      expect(screen.getByText('Community Rules & Guidelines')).toBeInTheDocument();
    });

    it('renders CommunityCreateModal and handles step navigation', () => {
      const handleClose = vi.fn();
      renderWithProviders(
        <CommunityCreateModal open={true} onClose={handleClose} />
      );

      expect(screen.getByText('Create New Professional Community')).toBeInTheDocument();
      expect(screen.getByText('Basic Info')).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Community Name \/ Title/i);
      fireEvent.change(nameInput, { target: { value: 'AI Frontiers' } });

      const continueBtn = screen.getByText('Continue');
      fireEvent.click(continueBtn);

      expect(screen.getByText('Topics & Hashtags')).toBeInTheDocument();
    });

    it('renders CommunityFeed and post publishing form', async () => {
      const posts = [
        {
          id: 'post-1',
          communityId: 'comm-1',
          authorId: 'u-1',
          authorName: 'Alex Rivera',
          title: 'Initial Discussion',
          content: 'Hello World post content',
          isPinned: true,
          isAnnouncement: false,
          isLocked: false,
          tags: ['General'],
          likesCount: 10,
          commentsCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(
        <CommunityFeed communityId="comm-1" posts={posts} userRole="owner" />
      );

      expect(screen.getByText('Start a Discussion')).toBeInTheDocument();
      expect(screen.getByText('Initial Discussion')).toBeInTheDocument();
      expect(screen.getByText('Hello World post content')).toBeInTheDocument();
    });

    it('renders CommunityMemberDirectory and filters members', () => {
      const members = [
        {
          id: 'm-1',
          communityId: 'comm-1',
          userId: 'u-1',
          name: 'Sarah Chen',
          email: 'sarah@test.com',
          role: 'admin' as const,
          title: 'Staff SRE',
          joinedAt: new Date().toISOString(),
          status: 'active' as const,
        },
      ];

      renderWithProviders(
        <CommunityMemberDirectory communityId="comm-1" members={members} userRole="owner" />
      );

      expect(screen.getByText(/Community Member Directory/i)).toBeInTheDocument();
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    it('renders CommunityEventsCard and handles RSVP', () => {
      const events = [
        {
          id: 'evt-1',
          communityId: 'comm-1',
          title: 'DevOps Summit 2026',
          description: 'Global keynote presentation',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          isOnline: true,
          organizerId: 'u-1',
          organizerName: 'Alex Rivera',
          rsvpCount: 25,
          createdAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(
        <CommunityEventsCard communityId="comm-1" events={events} userRole="owner" />
      );

      expect(screen.getByText(/Upcoming Events & Webinars/i)).toBeInTheDocument();
      expect(screen.getByText('DevOps Summit 2026')).toBeInTheDocument();
      expect(screen.getByText('Going')).toBeInTheDocument();
    });

    it('renders CommunityResourcesCard and displays resources', () => {
      const resources = [
        {
          id: 'res-1',
          communityId: 'comm-1',
          title: 'Kubernetes Hardening Playbook',
          description: 'Security rules for production',
          category: 'guide' as const,
          url: 'https://kirmya.io/guide',
          authorId: 'u-1',
          authorName: 'Sarah Chen',
          downloadsCount: 150,
          createdAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(
        <CommunityResourcesCard communityId="comm-1" resources={resources} userRole="owner" />
      );

      expect(screen.getByText(/Shared Knowledge & Resources/i)).toBeInTheDocument();
      expect(screen.getByText('Kubernetes Hardening Playbook')).toBeInTheDocument();
    });

    it('renders CommunityModerationDesk', () => {
      const actions = [
        {
          id: 'mod-1',
          communityId: 'comm-1',
          targetType: 'post' as const,
          targetId: 'post-99',
          targetContentSnippet: 'Spam text sample',
          reporterId: 'u-2',
          reporterName: 'Reporter User',
          reason: 'Spam',
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(
        <CommunityModerationDesk communityId="comm-1" actions={actions} />
      );

      expect(screen.getByText('Community Moderation & Safety Desk')).toBeInTheDocument();
      expect(screen.getByText(/Spam text sample/i)).toBeInTheDocument();
    });

    it('renders CommunitySettingsTab and updates form fields', () => {
      renderWithProviders(
        <CommunitySettingsTab community={sampleCommunity} />
      );

      expect(screen.getByText('Community Settings & Governance')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cloud & DevOps Architects')).toBeInTheDocument();
    });
  });

  describe('TASK 3: App Router Pages', () => {
    it('renders CommunitiesDiscoveryPage (/communities)', async () => {
      renderWithProviders(<CommunitiesDiscoveryPage />);
      await waitFor(() => {
        expect(screen.getByText(/Connect with Industry Peers & Engineering Leaders/i)).toBeInTheDocument();
      });
    });

    it('renders CreateCommunityPage (/communities/create)', () => {
      renderWithProviders(<CreateCommunityPage />);
      expect(screen.getByText('Launch a New Professional Community')).toBeInTheDocument();
    });

    it('renders CommunityHubPage (/communities/[id])', async () => {
      renderWithProviders(<CommunityHubPage />);
      await waitFor(() => {
        expect(screen.getByTestId('community-hub-page')).toBeInTheDocument();
      });
    });

    it('renders CommunityMembersPage (/communities/[id]/members)', async () => {
      renderWithProviders(<CommunityMembersPage />);
      await waitFor(() => {
        expect(screen.getByTestId('community-members-page')).toBeInTheDocument();
      });
    });

    it('renders CommunityAboutPage (/communities/[id]/about)', async () => {
      renderWithProviders(<CommunityAboutPage />);
      await waitFor(() => {
        expect(screen.getByTestId('community-about-page')).toBeInTheDocument();
      });
    });

    it('renders CommunitySettingsPage (/communities/[id]/settings)', async () => {
      renderWithProviders(<CommunitySettingsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('community-settings-page')).toBeInTheDocument();
      });
    });

    it('renders CommunityModerationPage (/communities/[id]/moderation)', async () => {
      renderWithProviders(<CommunityModerationPage />);
      await waitFor(() => {
        expect(screen.getByTestId('community-moderation-page')).toBeInTheDocument();
      });
    });

    it('renders CommunityEventsPage (/communities/[id]/events)', async () => {
      renderWithProviders(<CommunityEventsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('community-events-page')).toBeInTheDocument();
      });
    });
  });
});
