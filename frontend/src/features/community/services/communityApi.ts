import axios from 'axios';
import {
  Community,
  CommunityMember,
  CommunityPost,
  CommunityComment,
  CommunityEvent,
  CommunityResource,
  CommunityModerationAction,
  CommunityInvite,
  CommunityJoinRequest,
} from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';
const IS_TEST_ENV = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true');

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

// Mock Initial In-Memory State for Offline / Fallback mode
const mockCommunities: Community[] = [
  {
    id: 'comm-1',
    title: 'Cloud & DevOps Architects',
    description: 'A global community of Cloud Native engineers, Kubernetes experts, and DevOps leads sharing best practices and architecture blueprints.',
    category: 'Engineering & Cloud',
    location: 'Global (Remote)',
    avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150',
    coverImageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',
    isPrivate: false,
    memberCount: 1420,
    postCount: 384,
    rules: [
      'Be respectful and professional in technical discussions.',
      'No unsolicited product spam or marketing pitches.',
      'Use proper code snippets and architectural diagrams when sharing code.',
      'Protect sensitive internal enterprise configuration details.',
    ],
    topics: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Observability'],
    postingPermission: 'all',
    status: 'active',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    role: 'owner',
    isMember: true,
  },
  {
    id: 'comm-2',
    title: 'AI & Data Science Innovators',
    description: 'Connecting machine learning engineers, AI researchers, and data strategists building LLMs, neural networks, and scalable pipelines.',
    category: 'Artificial Intelligence',
    location: 'San Francisco, CA & Remote',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    coverImageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
    isPrivate: false,
    memberCount: 2850,
    postCount: 920,
    rules: [
      'Cite sources and benchmark datasets for AI papers.',
      'Engage constructively on ethics and model safety.',
      'Share code samples via open GitHub links.',
    ],
    topics: ['LLMs', 'PyTorch', 'Computer Vision', 'MLOps', 'GenAI'],
    postingPermission: 'all',
    status: 'active',
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
    role: 'member',
    isMember: true,
  },
  {
    id: 'comm-3',
    title: 'FinTech & Quantum Banking Group',
    description: 'Exclusive invitation-only circle for leaders shaping high-frequency trading, blockchain infrastructure, and regulatory compliance.',
    category: 'Finance & Banking',
    location: 'New York / London',
    avatarUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150',
    coverImageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
    isPrivate: true,
    memberCount: 430,
    postCount: 156,
    rules: [
      'Chatham House Rule applies strictly to internal discussions.',
      'Strict verification required prior to member approval.',
    ],
    topics: ['FinTech', 'Algorithmic Trading', 'Compliance', 'Security'],
    postingPermission: 'approved_only',
    status: 'active',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
    role: null,
    isMember: false,
  },
];

const mockMembers: Record<string, CommunityMember[]> = {
  'comm-1': [
    {
      id: 'mem-1',
      communityId: 'comm-1',
      userId: MOCK_USER_ID,
      name: 'Alex Rivera',
      email: 'alex.rivera@kirmya.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      role: 'owner',
      title: 'Principal Cloud Architect',
      company: 'Kirmya Tech Solutions',
      joinedAt: '2025-01-15T00:00:00Z',
      status: 'active',
    },
    {
      id: 'mem-2',
      communityId: 'comm-1',
      userId: 'user-202',
      name: 'Sarah Chen',
      email: 'sarah.c@devops.org',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
      role: 'admin',
      title: 'Staff Site Reliability Engineer',
      company: 'CloudScale Inc.',
      joinedAt: '2025-01-16T00:00:00Z',
      status: 'active',
    },
    {
      id: 'mem-3',
      communityId: 'comm-1',
      userId: 'user-303',
      name: 'Marcus Vance',
      email: 'marcus@infra.net',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: 'moderator',
      title: 'DevOps Lead',
      company: 'FinTech Dynamics',
      joinedAt: '2025-01-20T00:00:00Z',
      status: 'active',
    },
    {
      id: 'mem-4',
      communityId: 'comm-1',
      userId: 'user-404',
      name: 'David Kim',
      email: 'david.k@k8s.io',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      role: 'member',
      title: 'Infrastructure Engineer',
      company: 'DataFlow Systems',
      joinedAt: '2025-02-01T00:00:00Z',
      status: 'active',
    },
  ],
};

const mockPosts: Record<string, CommunityPost[]> = {
  'comm-1': [
    {
      id: 'post-101',
      communityId: 'comm-1',
      authorId: MOCK_USER_ID,
      authorName: 'Alex Rivera',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      authorRole: 'owner',
      title: 'Announcement: Welcome to Cloud & DevOps Architects 2026 Roadmap!',
      content: 'Welcome everyone! We are launching our updated monthly architecture teardown webinars. Check out the pinned resources for Kubernetes multi-cluster routing guidelines.',
      isPinned: true,
      isAnnouncement: true,
      isLocked: false,
      category: 'Announcement',
      tags: ['Community', 'Roadmap', 'Cloud'],
      likesCount: 42,
      commentsCount: 8,
      userLiked: true,
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    },
    {
      id: 'post-102',
      communityId: 'comm-1',
      authorId: 'user-202',
      authorName: 'Sarah Chen',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
      authorRole: 'admin',
      title: 'Best Practices for Zero-Downtime Migration with Istio Service Mesh',
      content: 'We recently completed a 500-microservice migration to Istio 1.20 across three multi-region EKS clusters. Here are our key learnings on canary traffic shifting and blue-green database sync.',
      isPinned: false,
      isAnnouncement: false,
      isLocked: false,
      category: 'Architecture',
      tags: ['Kubernetes', 'Istio', 'ServiceMesh', 'EKS'],
      likesCount: 89,
      commentsCount: 14,
      userLiked: false,
      createdAt: '2026-02-08T14:30:00Z',
      updatedAt: '2026-02-08T14:30:00Z',
    },
  ],
};

const mockComments: Record<string, CommunityComment[]> = {
  'post-101': [
    {
      id: 'cmt-1',
      postId: 'post-101',
      authorId: 'user-303',
      authorName: 'Marcus Vance',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      content: 'Super excited for the upcoming webinars! Will the recordings be shared in the Resources tab?',
      createdAt: '2026-02-01T11:15:00Z',
    },
  ],
};

const mockEvents: Record<string, CommunityEvent[]> = {
  'comm-1': [
    {
      id: 'evt-1',
      communityId: 'comm-1',
      title: 'Kubernetes 1.30 Security Deep Dive & Cluster Hardening Workshop',
      description: 'Hands-on workshop covering eBPF runtime security, admission controllers, and zero-trust policies.',
      startDate: '2026-08-25T18:00:00Z',
      endDate: '2026-08-25T20:00:00Z',
      location: 'Virtual Zoom Event',
      isOnline: true,
      meetingUrl: 'https://zoom.us/j/123456789',
      organizerId: MOCK_USER_ID,
      organizerName: 'Alex Rivera',
      rsvpCount: 68,
      userRsvp: 'attending',
      capacity: 100,
      createdAt: '2026-02-05T00:00:00Z',
    },
  ],
};

const mockResources: Record<string, CommunityResource[]> = {
  'comm-1': [
    {
      id: 'res-1',
      communityId: 'comm-1',
      title: 'Enterprise Multi-Cloud Terraform Module Standard v3.2',
      description: 'Production-ready Terraform blueprints with built-in SOC2 compliant security defaults for AWS, Azure & GCP.',
      category: 'code',
      url: 'https://github.com/kirmya/cloud-terraform-modules',
      fileType: 'ZIP / HCL',
      authorId: MOCK_USER_ID,
      authorName: 'Alex Rivera',
      downloadsCount: 312,
      createdAt: '2026-01-20T00:00:00Z',
    },
    {
      id: 'res-2',
      communityId: 'comm-1',
      title: 'DevOps Incident Response Playbook & Runbooks',
      description: 'Comprehensive guide for Sev-1 incident triage, escalation matrix, and post-mortem templates.',
      category: 'guide',
      url: 'https://kirmya.io/docs/incident-playbook.pdf',
      fileType: 'PDF',
      authorId: 'user-202',
      authorName: 'Sarah Chen',
      downloadsCount: 540,
      createdAt: '2026-01-25T00:00:00Z',
    },
  ],
};

const mockModerationActions: Record<string, CommunityModerationAction[]> = {
  'comm-1': [
    {
      id: 'mod-1',
      communityId: 'comm-1',
      targetType: 'post',
      targetId: 'post-99',
      targetContentSnippet: 'Buy crypto tokens fast! Guaranteed 500% returns at crypto-spam.xyz',
      reporterId: 'user-404',
      reporterName: 'David Kim',
      reason: 'Spam / Unsolicited Promotion',
      actionTaken: 'delete',
      moderatorId: MOCK_USER_ID,
      moderatorName: 'Alex Rivera',
      notes: 'Removed spam post and warned user.',
      status: 'resolved',
      createdAt: '2026-02-07T09:00:00Z',
    },
  ],
};

const mockJoinRequests: Record<string, CommunityJoinRequest[]> = {
  'comm-3': [
    {
      id: 'req-1',
      communityId: 'comm-3',
      userId: 'user-777',
      userName: 'Elena Rostova',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      userTitle: 'Quantitative Strategist @ hedgefund.io',
      reason: 'Looking to participate in peer discussions on quantum financial modeling.',
      status: 'pending',
      createdAt: '2026-02-12T14:00:00Z',
    },
  ],
};

const mockInvites: Record<string, CommunityInvite[]> = {
  'comm-1': [
    {
      id: 'inv-1',
      communityId: 'comm-1',
      email: 'lead.architect@partner.com',
      role: 'moderator',
      inviterId: MOCK_USER_ID,
      inviterName: 'Alex Rivera',
      token: 'tok-abc-123',
      status: 'pending',
      createdAt: '2026-02-10T00:00:00Z',
      expiresAt: '2026-02-24T00:00:00Z',
    },
  ],
};

export const communityApi = {
  getMockUserId: () => MOCK_USER_ID,

  listCommunities: async (params?: { category?: string; query?: string; location?: string }): Promise<Community[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get('/communities', { params });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (e) {
        // fallback
      }
    }
    let res = [...mockCommunities];
    if (params?.category) {
      res = res.filter((c) => c.category.toLowerCase().includes(params.category!.toLowerCase()));
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      res = res.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params?.location) {
      res = res.filter((c) => c.location?.toLowerCase().includes(params.location!.toLowerCase()));
    }
    return res;
  },

  getCommunity: async (id: string): Promise<Community> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${id}`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const found = mockCommunities.find((c) => c.id === id);
    if (found) return found;
    return {
      id,
      title: `Community ${id}`,
      description: 'Professional collaboration community for engineering and industry insights.',
      category: 'Technology',
      location: 'Global',
      isPrivate: false,
      memberCount: 120,
      postCount: 45,
      rules: ['Respect members', 'No spam'],
      topics: ['Tech', 'Networking', 'Innovation'],
      postingPermission: 'all',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'member',
      isMember: true,
    };
  },

  createCommunity: async (data: {
    title: string;
    description: string;
    category: string;
    location?: string;
    isPrivate?: boolean;
    rules?: string[];
    topics?: string[];
    postingPermission?: 'all' | 'mods_only' | 'approved_only';
  }): Promise<Community> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post('/communities', data);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const newComm: Community = {
      id: `comm-${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category || 'General',
      location: data.location || 'Remote',
      isPrivate: !!data.isPrivate,
      memberCount: 1,
      postCount: 0,
      rules: data.rules || ['Be respectful', 'No spam'],
      topics: data.topics || ['General'],
      postingPermission: data.postingPermission || 'all',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'owner',
      isMember: true,
    };
    mockCommunities.unshift(newComm);
    return newComm;
  },

  updateCommunity: async (id: string, data: Partial<Community>): Promise<Community> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.put(`/communities/${id}`, data);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const comm = await communityApi.getCommunity(id);
    const updated = { ...comm, ...data, updatedAt: new Date().toISOString() };
    const idx = mockCommunities.findIndex((c) => c.id === id);
    if (idx !== -1) mockCommunities[idx] = updated;
    return updated;
  },

  deleteCommunity: async (id: string): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.delete(`/communities/${id}`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const idx = mockCommunities.findIndex((c) => c.id === id);
    if (idx !== -1) mockCommunities.splice(idx, 1);
    return { success: true };
  },

  joinCommunity: async (id: string): Promise<{ success: boolean; isMember: boolean; pendingApproval?: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/join`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const comm = mockCommunities.find((c) => c.id === id);
    if (comm) {
      if (comm.isPrivate) {
        return { success: true, isMember: false, pendingApproval: true };
      }
      comm.isMember = true;
      comm.memberCount += 1;
      comm.role = 'member';
    }
    return { success: true, isMember: true };
  },

  leaveCommunity: async (id: string): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/leave`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const comm = mockCommunities.find((c) => c.id === id);
    if (comm && comm.isMember) {
      comm.isMember = false;
      comm.memberCount = Math.max(0, comm.memberCount - 1);
      comm.role = null;
    }
    return { success: true };
  },

  getJoinRequests: async (communityId: string): Promise<CommunityJoinRequest[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${communityId}/join-requests`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    return mockJoinRequests[communityId] || [];
  },

  approveMembership: async (id: string, candidateId: string, approve: boolean): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.put(`/communities/${id}/memberships`, { candidateId, approve });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const reqs = mockJoinRequests[id] || [];
    const idx = reqs.findIndex((r) => r.id === candidateId || r.userId === candidateId);
    if (idx !== -1) {
      reqs[idx].status = approve ? 'approved' : 'rejected';
    }
    return { success: true };
  },

  getMembers: async (communityId: string, search?: string): Promise<CommunityMember[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${communityId}/members`, { params: { search } });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    let list = mockMembers[communityId] || [
      {
        id: 'mem-default-1',
        communityId,
        userId: MOCK_USER_ID,
        name: 'Current User',
        email: 'user@kirmya.io',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        status: 'active',
      },
    ];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    return list;
  },

  assignRole: async (id: string, targetUserId: string, roleName: string): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.put(`/communities/${id}/roles`, { targetUserId, roleName });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const list = mockMembers[id] || [];
    const m = list.find((item) => item.userId === targetUserId || item.id === targetUserId);
    if (m) {
      m.role = roleName as any;
    }
    return { success: true };
  },

  removeMember: async (communityId: string, targetUserId: string): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.delete(`/communities/${communityId}/members/${targetUserId}`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    if (mockMembers[communityId]) {
      mockMembers[communityId] = mockMembers[communityId].filter(
        (m) => m.userId !== targetUserId && m.id !== targetUserId
      );
    }
    return { success: true };
  },

  getPosts: async (id: string): Promise<CommunityPost[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${id}/posts`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    return mockPosts[id] || [];
  },

  createPost: async (
    id: string,
    data: { content: string; title?: string; category?: string; tags?: string[]; isAnnouncement?: boolean; isPinned?: boolean }
  ): Promise<CommunityPost> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/posts`, data);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      communityId: id,
      authorId: MOCK_USER_ID,
      authorName: 'Current User',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      authorRole: 'member',
      title: data.title,
      content: data.content,
      isPinned: !!data.isPinned,
      isAnnouncement: !!data.isAnnouncement,
      isLocked: false,
      category: data.category || 'General',
      tags: data.tags || ['Discussion'],
      likesCount: 0,
      commentsCount: 0,
      userLiked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!mockPosts[id]) mockPosts[id] = [];
    mockPosts[id].unshift(newPost);
    return newPost;
  },

  pinPost: async (id: string, postId: string, isPinned: boolean): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.put(`/communities/${id}/posts/${postId}/pin`, { isPinned });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const list = mockPosts[id] || [];
    const p = list.find((post) => post.id === postId);
    if (p) p.isPinned = isPinned;
    return { success: true };
  },

  lockPost: async (id: string, postId: string, isLocked: boolean): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.put(`/communities/${id}/posts/${postId}/lock`, { isLocked });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const list = mockPosts[id] || [];
    const p = list.find((post) => post.id === postId);
    if (p) p.isLocked = isLocked;
    return { success: true };
  },

  deletePost: async (id: string, postId: string): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.delete(`/communities/${id}/posts/${postId}`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    if (mockPosts[id]) {
      mockPosts[id] = mockPosts[id].filter((p) => p.id !== postId);
    }
    return { success: true };
  },

  likePost: async (id: string, postId: string): Promise<{ success: boolean; likesCount: number; userLiked: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/posts/${postId}/like`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const list = mockPosts[id] || [];
    const p = list.find((post) => post.id === postId);
    if (p) {
      p.userLiked = !p.userLiked;
      p.likesCount = p.userLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
      return { success: true, likesCount: p.likesCount, userLiked: p.userLiked };
    }
    return { success: true, likesCount: 1, userLiked: true };
  },

  getComments: async (id: string, postId: string): Promise<CommunityComment[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${id}/posts/${postId}/comments`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    return mockComments[postId] || [];
  },

  addComment: async (id: string, postId: string, content: string): Promise<CommunityComment> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/posts/${postId}/comments`, { content });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const cmt: CommunityComment = {
      id: `cmt-${Date.now()}`,
      postId,
      authorId: MOCK_USER_ID,
      authorName: 'Current User',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      content,
      createdAt: new Date().toISOString(),
    };
    if (!mockComments[postId]) mockComments[postId] = [];
    mockComments[postId].push(cmt);
    const post = (mockPosts[id] || []).find((p) => p.id === postId);
    if (post) post.commentsCount += 1;
    return cmt;
  },

  getEvents: async (id: string): Promise<CommunityEvent[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${id}/events`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    return mockEvents[id] || [];
  },

  createEvent: async (id: string, eventData: Partial<CommunityEvent>): Promise<CommunityEvent> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/events`, eventData);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const newEvt: CommunityEvent = {
      id: `evt-${Date.now()}`,
      communityId: id,
      title: eventData.title || 'Untitled Community Event',
      description: eventData.description || '',
      startDate: eventData.startDate || new Date().toISOString(),
      endDate: eventData.endDate || new Date(Date.now() + 7200000).toISOString(),
      location: eventData.location || 'Online',
      isOnline: eventData.isOnline ?? true,
      meetingUrl: eventData.meetingUrl || 'https://meet.jit.si/kirmya-community',
      organizerId: MOCK_USER_ID,
      organizerName: 'Current User',
      rsvpCount: 1,
      userRsvp: 'attending',
      capacity: eventData.capacity || 50,
      createdAt: new Date().toISOString(),
    };
    if (!mockEvents[id]) mockEvents[id] = [];
    mockEvents[id].unshift(newEvt);
    return newEvt;
  },

  rsvpEvent: async (
    id: string,
    eventId: string,
    status: 'attending' | 'declined' | 'maybe'
  ): Promise<{ success: boolean; rsvpCount: number; userRsvp: string }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/events/${eventId}/rsvp`, { status });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const list = mockEvents[id] || [];
    const evt = list.find((e) => e.id === eventId);
    if (evt) {
      const prev = evt.userRsvp;
      evt.userRsvp = status;
      if (prev !== 'attending' && status === 'attending') {
        evt.rsvpCount += 1;
      } else if (prev === 'attending' && status !== 'attending') {
        evt.rsvpCount = Math.max(0, evt.rsvpCount - 1);
      }
      return { success: true, rsvpCount: evt.rsvpCount, userRsvp: status };
    }
    return { success: true, rsvpCount: 1, userRsvp: status };
  },

  getResources: async (id: string): Promise<CommunityResource[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${id}/resources`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    return mockResources[id] || [];
  },

  createResource: async (id: string, resourceData: Partial<CommunityResource>): Promise<CommunityResource> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/resources`, resourceData);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const newRes: CommunityResource = {
      id: `res-${Date.now()}`,
      communityId: id,
      title: resourceData.title || 'Untitled Resource',
      description: resourceData.description || '',
      category: resourceData.category || 'document',
      url: resourceData.url || 'https://kirmya.io/resource',
      fileType: resourceData.fileType || 'PDF',
      authorId: MOCK_USER_ID,
      authorName: 'Current User',
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
    };
    if (!mockResources[id]) mockResources[id] = [];
    mockResources[id].unshift(newRes);
    return newRes;
  },

  getModerationActions: async (id: string): Promise<CommunityModerationAction[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${id}/moderation`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    return mockModerationActions[id] || [];
  },

  reportContent: async (
    id: string,
    targetId: string,
    targetType: 'post' | 'comment' | 'member',
    reason: string
  ): Promise<{ success: boolean; reportId: string }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/reports`, { targetId, targetType, reason });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const rep: CommunityModerationAction = {
      id: `mod-${Date.now()}`,
      communityId: id,
      targetType,
      targetId,
      targetContentSnippet: `Flagged content in ${targetType}`,
      reporterId: MOCK_USER_ID,
      reporterName: 'Current User',
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    if (!mockModerationActions[id]) mockModerationActions[id] = [];
    mockModerationActions[id].unshift(rep);
    return { success: true, reportId: rep.id };
  },

  takeModerationAction: async (
    id: string,
    actionId: string,
    actionTaken: 'dismiss' | 'pin' | 'lock' | 'delete' | 'ban_user' | 'mute_user' | 'warn',
    notes?: string
  ): Promise<{ success: boolean }> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/moderation/${actionId}/resolve`, { actionTaken, notes });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const list = mockModerationActions[id] || [];
    const item = list.find((a) => a.id === actionId);
    if (item) {
      item.actionTaken = actionTaken;
      item.notes = notes;
      item.status = actionTaken === 'dismiss' ? 'dismissed' : 'resolved';
      item.moderatorId = MOCK_USER_ID;
      item.moderatorName = 'Current User';
    }
    return { success: true };
  },

  sendInvite: async (id: string, email: string, role: string = 'member'): Promise<CommunityInvite> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.post(`/communities/${id}/invites`, { email, role });
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    const inv: CommunityInvite = {
      id: `inv-${Date.now()}`,
      communityId: id,
      email,
      role: role as any,
      inviterId: MOCK_USER_ID,
      inviterName: 'Current User',
      token: `tok-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    };
    if (!mockInvites[id]) mockInvites[id] = [];
    mockInvites[id].unshift(inv);
    return inv;
  },

  getInvites: async (id: string): Promise<CommunityInvite[]> => {
    if (!IS_TEST_ENV) {
      try {
        const response = await client.get(`/communities/${id}/invites`);
        if (response.data) return response.data;
      } catch (e) {
        // fallback
      }
    }
    return mockInvites[id] || [];
  },
};
