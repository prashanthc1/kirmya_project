import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { communityApi } from '../features/community/services/communityApi';
import { CommunityCard } from '../components/community/CommunityCard';
import { CommunityHeader } from '../components/community/CommunityHeader';
import { CommunityFeed } from '../components/community/CommunityFeed';
import { CommunityMemberDirectory } from '../components/community/CommunityMemberDirectory';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/communities/comm-1',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({ id: 'comm-1' }),
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Communities & Professional Groups Experience (Prompt 22/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCommunity = {
    id: 'comm-1',
    title: 'Cloud & DevOps Architects',
    description: 'A global community of Cloud Native engineers, Kubernetes experts, and DevOps leads.',
    category: 'Engineering & Cloud',
    location: 'Global (Remote)',
    avatarUrl: '',
    coverImageUrl: '',
    isPrivate: false,
    memberCount: 1420,
    postCount: 384,
    rules: ['Be respectful and professional.', 'No spam.'],
    topics: ['Kubernetes', 'AWS', 'Terraform'],
    postingPermission: 'all' as const,
    status: 'active' as const,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    role: 'owner' as const,
    isMember: true,
  };

  describe('CommunityCard Component', () => {
    it('renders community title, category, member count, and joined button', () => {
      renderWithTheme(<CommunityCard community={mockCommunity} />);

      expect(screen.getByText('Cloud & DevOps Architects')).toBeDefined();
      expect(screen.getByText('Engineering & Cloud')).toBeDefined();
      expect(screen.getByText(/1420 members/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Joined/i })).toBeDefined();
    });

    it('handles join/leave click on card', async () => {
      (authApiClient.post as any).mockImplementation((url: string) => {
        if (url === '/communities/comm-1/leave') {
          return Promise.resolve({ data: { success: true } });
        }
        return Promise.resolve({ data: {} });
      });
      const mockToggle = vi.fn();

      renderWithTheme(<CommunityCard community={mockCommunity} onJoinToggle={mockToggle} />);

      const btn = screen.getByRole('button', { name: /Joined/i });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(authApiClient.post).toHaveBeenCalledWith('/communities/comm-1/leave');
        expect(mockToggle).toHaveBeenCalledWith('comm-1', false);
      });
    });
  });

  describe('CommunityHeader Component', () => {
    it('renders header title, navigation tabs, and rules modal button', () => {
      renderWithTheme(<CommunityHeader community={mockCommunity} />);

      expect(screen.getByText('Cloud & DevOps Architects')).toBeDefined();
      expect(screen.getByText('Discussions')).toBeDefined();
      expect(screen.getByText('Members')).toBeDefined();
      expect(screen.getByText('Events')).toBeDefined();
      expect(screen.getByText('About & Rules')).toBeDefined();

      const rulesBtn = screen.getByRole('button', { name: /Rules/i });
      fireEvent.click(rulesBtn);
      expect(screen.getByText('Community Guidelines & Rules')).toBeDefined();
      expect(screen.getByText('Be respectful and professional.')).toBeDefined();
    });
  });

  describe('CommunityFeed Component', () => {
    const mockPosts = [
      {
        id: 'post-1',
        communityId: 'comm-1',
        authorId: 'u1',
        authorName: 'Alex Rivera',
        authorAvatar: '',
        authorRole: 'owner',
        title: 'Best practices for multi-cluster Kubernetes',
        content: 'Here is our blueprint for GitOps with ArgoCD across AWS EKS and GCP GKE.',
        isPinned: true,
        isAnnouncement: true,
        isLocked: false,
        tags: ['Kubernetes', 'ArgoCD'],
        likesCount: 24,
        commentsCount: 3,
        userLiked: false,
        createdAt: '2026-08-30T10:00:00Z',
        updatedAt: '2026-08-30T10:00:00Z',
      },
    ];

    it('renders discussion posts and allows post creation', async () => {
      (authApiClient.post as any).mockImplementation((url: string) => {
        if (url === '/communities/comm-1/posts') {
          return Promise.resolve({
            data: {
              id: 'post-new',
              communityId: 'comm-1',
              authorId: 'u1',
              authorName: 'Test User',
              title: 'New Discussion',
              content: 'Excited to discuss cloud architecture.',
              isPinned: false,
              isAnnouncement: false,
              isLocked: false,
              tags: [],
              likesCount: 0,
              commentsCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithTheme(
        <CommunityFeed
          communityId="comm-1"
          posts={mockPosts}
          userRole="owner"
        />
      );

      expect(screen.getByText('Best practices for multi-cluster Kubernetes')).toBeDefined();
      expect(screen.getByText(/Here is our blueprint for GitOps/i)).toBeDefined();

      const contentInput = screen.getByPlaceholderText(/Share insights/i);
      fireEvent.change(contentInput, { target: { value: 'Excited to discuss cloud architecture.' } });

      const postBtn = screen.getByRole('button', { name: /Publish Post/i });
      fireEvent.click(postBtn);

      await waitFor(() => {
        expect(authApiClient.post).toHaveBeenCalledWith('/communities/comm-1/posts', expect.any(Object));
      });
    });
  });

  describe('CommunityMemberDirectory Component', () => {
    const mockMembers = [
      {
        id: 'mem-1',
        communityId: 'comm-1',
        userId: 'u1',
        name: 'Alex Rivera',
        email: 'alex.rivera@kirmya.io',
        role: 'owner' as const,
        title: 'Principal Cloud Architect',
        company: 'Kirmya Tech',
        joinedAt: '2025-01-15T00:00:00Z',
        status: 'active' as const,
      },
      {
        id: 'mem-2',
        communityId: 'comm-1',
        userId: 'u2',
        name: 'Sarah Chen',
        email: 'sarah.c@devops.org',
        role: 'admin' as const,
        title: 'Staff SRE',
        company: 'CloudScale',
        joinedAt: '2025-01-16T00:00:00Z',
        status: 'active' as const,
      },
    ];

    it('renders member cards with names, roles, and search filter', () => {
      renderWithTheme(
        <CommunityMemberDirectory
          communityId="comm-1"
          members={mockMembers}
          userRole="owner"
        />
      );

      expect(screen.getByText('Alex Rivera')).toBeDefined();
      expect(screen.getByText('Sarah Chen')).toBeDefined();
      expect(screen.getByText('Principal Cloud Architect')).toBeDefined();
    });
  });

  describe('communityApi Methods', () => {
    it('listCommunities calls GET /communities with params', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({ data: [mockCommunity] });

      const res = await communityApi.listCommunities({ category: 'Engineering & Cloud' });
      expect(authApiClient.get).toHaveBeenCalledWith('/communities', {
        params: { category: 'Engineering & Cloud' },
      });
      expect(res).toEqual([mockCommunity]);
    });

    it('getCommunity calls GET /communities/:id', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({ data: mockCommunity });

      const res = await communityApi.getCommunity('comm-1');
      expect(authApiClient.get).toHaveBeenCalledWith('/communities/comm-1');
      expect(res.title).toBe('Cloud & DevOps Architects');
    });

    it('joinCommunity calls POST /communities/:id/join', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: { success: true } });

      const res = await communityApi.joinCommunity('comm-1');
      expect(authApiClient.post).toHaveBeenCalledWith('/communities/comm-1/join');
      expect(res.success).toBe(true);
    });

    it('leaveCommunity calls POST /communities/:id/leave', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: { success: true } });

      const res = await communityApi.leaveCommunity('comm-1');
      expect(authApiClient.post).toHaveBeenCalledWith('/communities/comm-1/leave');
      expect(res.success).toBe(true);
    });

    it('createPost calls POST /communities/:id/posts', async () => {
      const mockPost = { id: 'p1', content: 'hello' };
      (authApiClient.post as any).mockResolvedValueOnce({ data: mockPost });

      const res = await communityApi.createPost('comm-1', { content: 'hello' });
      expect(authApiClient.post).toHaveBeenCalledWith('/communities/comm-1/posts', { content: 'hello' });
      expect(res).toEqual(mockPost);
    });
  });
});
