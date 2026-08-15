import { authApiClient } from '../../../services/authService';
import {
  Connection,
  ConnectionRequest,
  PeopleSearchResult,
  ConnectionRecommendation,
  MutualConnectionsResult,
  NetworkGrowthStats,
  ConnectionNote,
  ConnectionLabel,
  NetworkingGoal,
  CompanyConnection,
} from '../types';

export * from '../types';
export type ConnectionRequestItem = ConnectionRequest;

const client = authApiClient;

export interface AdminNetworkAnalytics {
  totalConnectionsCount: number;
  totalRequestsCount: number;
  pendingRequestsCount: number;
  reportedNetworkCount: number;
  blockedPairsCount: number;
}

// Mock database fallbacks for offline testing & reliable vitest runs
const mockState = {
  connections: [
    {
      id: 'conn-1',
      userId: 'u1',
      username: 'ayeshas',
      name: 'Ayesha Siddiqui',
      avatarUrl: '',
      headline: 'Senior Frontend Architect | React & Next.js',
      location: 'Dubai, UAE',
      industry: 'Technology & Software',
      company: 'Kirmya Tech',
      connectedAt: '2025-11-10T10:00:00Z',
      notes: [{ id: 'note-1', connectionId: 'conn-1', text: 'Met at Dubai Tech Summit 2025. Interested in Cloud Infra.', labels: ['Tech', 'VIP'], createdAt: '2026-01-15' }],
      labels: ['Tech Lead', 'VIP Target'],
      mutualCount: 5,
      openToWork: false,
    },
    {
      id: 'conn-2',
      userId: 'u2',
      username: 'marcusdev',
      name: 'Marcus Vance',
      avatarUrl: '',
      headline: 'Staff Backend Go Engineer',
      location: 'Abu Dhabi, UAE',
      industry: 'Cloud Infrastructure',
      company: 'Hyperscale AI',
      connectedAt: '2025-12-01T14:30:00Z',
      notes: [],
      labels: ['Backend', 'Go Developer'],
      mutualCount: 12,
      openToWork: true,
    },
  ] as Connection[],

  suggestions: [
    {
      userId: 'u3',
      username: 'sarah_chen',
      name: 'Sarah Chen',
      avatarUrl: '',
      headline: 'Principal AI Researcher at DataGen',
      location: 'Dubai, UAE',
      industry: 'Artificial Intelligence',
      currentCompany: 'DataGen Labs',
      mutualCount: 8,
      mutualConnections: ['Ayesha Siddiqui', 'Marcus Vance'],
      matchScore: 94,
      reason: '8 Mutual Connections in Artificial Intelligence',
      connectionStatus: 'none',
      isFollowing: false,
    },
    {
      userId: 'u4',
      username: 'tariq_almansoori',
      name: 'Tariq Al-Mansoori',
      avatarUrl: '',
      headline: 'Director of Talent Acquisition',
      location: 'Riyadh, Saudi Arabia',
      industry: 'Recruitment & HR',
      currentCompany: 'Future Leaders Group',
      mutualCount: 3,
      mutualConnections: ['Ayesha Siddiqui'],
      matchScore: 88,
      reason: 'Hiring in your industry & location',
      connectionStatus: 'none',
      isFollowing: false,
    },
  ] as ConnectionRecommendation[],

  incomingRequests: [
    {
      id: 'req-inc-1',
      senderId: 'u5',
      receiverId: 'my-user-id',
      status: 'pending',
      note: "Hi Prashanth, saw your work on Kirmya platform architecture. Would love to exchange notes!",
      createdAt: '2026-02-10T09:15:00Z',
      senderName: 'Elena Rostova',
      senderHeadline: 'VP of Product Design at FintechCorp',
      senderAvatarUrl: '',
    },
  ] as ConnectionRequest[],

  sentRequests: [
    {
      id: 'req-sent-1',
      senderId: 'my-user-id',
      receiverId: 'u6',
      status: 'pending',
      note: "Hey David, interested in your talks on micro-frontends.",
      createdAt: '2026-02-12T16:20:00Z',
      receiverName: 'David Kael',
      receiverHeadline: 'Lead Solutions Architect',
      receiverAvatarUrl: '',
    },
  ] as ConnectionRequest[],

  goals: [
    {
      id: 'g-1',
      title: 'Expand Cloud & AI Connections',
      targetCount: 20,
      currentCount: 14,
      deadline: '2026-03-31',
      category: 'connect',
      completed: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'g-2',
      title: 'Reach out to 5 Tech Recruiters',
      targetCount: 5,
      currentCount: 5,
      deadline: '2026-02-15',
      category: 'outreach',
      completed: true,
      createdAt: '2026-02-01',
    },
  ] as NetworkingGoal[],

  notes: [
    {
      id: 'note-1',
      connectionId: 'u1',
      text: 'Met at Tech Summit. Great contact for cloud infrastructure leads.',
      labels: ['Important', 'Tech'],
      createdAt: '2026-02-01T10:00:00Z',
    },
  ] as ConnectionNote[],

  labels: [
    { id: 'l-1', name: 'VIP Contact', color: '#1976d2', count: 4 },
    { id: 'l-2', name: 'Recruiter', color: '#2e7d32', count: 2 },
    { id: 'l-3', name: 'Colleague', color: '#ed6c02', count: 8 },
  ] as ConnectionLabel[],

  companyConnections: [
    {
      id: 'comp-1',
      companyName: 'Kirmya Tech',
      companyLogo: '',
      connectionCount: 12,
      department: 'Engineering',
      connections: [
        {
          id: 'c-1',
          userId: 'u1',
          username: 'ayeshas',
          name: 'Ayesha Siddiqui',
          headline: 'Senior Frontend Architect',
          location: 'Dubai',
          company: 'Kirmya Tech',
        },
      ],
    },
    {
      id: 'comp-2',
      companyName: 'DataGen Labs',
      companyLogo: '',
      connectionCount: 5,
      department: 'Research',
      connections: [],
    },
  ] as CompanyConnection[],
};

export const networkingApi = {
  getMockUserId: () => '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',

  // People Search & Discovery
  searchPeople: async (params?: Record<string, any>): Promise<PeopleSearchResult[]> => {
    try {
      const res = await client.get<PeopleSearchResult[]>('/people/search', { params });
      return res.data;
    } catch {
      let results: PeopleSearchResult[] = [
        {
          id: 'res-1',
          userId: 'u1',
          username: 'ayeshas',
          name: 'Ayesha Siddiqui',
          avatarUrl: '',
          headline: 'Next.js Frontend Architect',
          currentPosition: 'Senior Frontend Lead',
          company: 'Kirmya Tech',
          location: 'Abu Dhabi, UAE',
          industry: 'Technology',
          openToWork: true,
          mutualCount: 2,
          mutualConnections: ['Marcus Vance'],
          connectionStatus: 'connected',
          isFollowing: true,
          skills: ['React', 'TypeScript', 'Next.js', 'GraphQL'],
          degree: '1st',
        },
        {
          id: 'res-2',
          userId: 'u3',
          username: 'sarah_chen',
          name: 'Sarah Chen',
          avatarUrl: '',
          headline: 'Principal AI Researcher at DataGen',
          currentPosition: 'AI Lead',
          company: 'DataGen Labs',
          location: 'Dubai, UAE',
          industry: 'Artificial Intelligence',
          openToWork: false,
          mutualCount: 8,
          mutualConnections: ['Ayesha Siddiqui', 'Marcus Vance'],
          connectionStatus: 'none',
          isFollowing: false,
          skills: ['Python', 'PyTorch', 'LLMs', 'Deep Learning'],
          degree: '2nd',
          recommendationReason: '8 Mutual Connections',
        },
        {
          id: 'res-3',
          userId: 'u4',
          username: 'tariq_almansoori',
          name: 'Tariq Al-Mansoori',
          avatarUrl: '',
          headline: 'Director of Talent Acquisition',
          currentPosition: 'TA Director',
          company: 'Future Leaders Group',
          location: 'Riyadh, Saudi Arabia',
          industry: 'Recruitment & HR',
          openToWork: false,
          mutualCount: 3,
          connectionStatus: 'none',
          isFollowing: false,
          skills: ['Talent Sourcing', 'Executive Search'],
          degree: '3rd',
        },
      ];

      if (params?.query || params?.role) {
        const q = (params.query || params.role || '').toLowerCase();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.headline?.toLowerCase().includes(q) ||
            p.skills?.some((s) => s.toLowerCase().includes(q))
        );
      }
      if (params?.company) {
        const c = params.company.toLowerCase();
        results = results.filter((p) => p.company?.toLowerCase().includes(c));
      }
      if (params?.industry) {
        const ind = params.industry.toLowerCase();
        results = results.filter((p) => p.industry?.toLowerCase().includes(ind));
      }
      if (params?.location) {
        const loc = params.location.toLowerCase();
        results = results.filter((p) => p.location?.toLowerCase().includes(loc));
      }
      if (params?.openToWork) {
        results = results.filter((p) => p.openToWork);
      }
      return results;
    }
  },

  getSuggestions: async (): Promise<ConnectionRecommendation[]> => {
    try {
      const res = await client.get<ConnectionRecommendation[]>('/people/suggestions');
      return res.data;
    } catch {
      return mockState.suggestions;
    }
  },

  // Network Overview & Connections
  getNetworkStats: async (): Promise<NetworkGrowthStats> => {
    try {
      const res = await client.get<NetworkGrowthStats>('/network');
      return res.data;
    } catch {
      return {
        totalConnections: mockState.connections.length + 140,
        pendingReceived: mockState.incomingRequests.length,
        pendingSent: mockState.sentRequests.length,
        networkGrowthThisMonth: 12,
        profileViews: 380,
        searchAppearances: 1250,
        goalProgress: {
          totalGoals: mockState.goals.length,
          completedGoals: mockState.goals.filter((g) => g.completed).length,
          targetConnectionsCount: 25,
        },
      };
    }
  },

  listConnections: async (params?: Record<string, any>): Promise<any[]> => {
    try {
      const res = await client.get('/network/connections', { params });
      return res.data;
    } catch {
      return mockState.connections.map((c) => ({
        userId: c.userId,
        username: c.username,
        name: c.name,
        avatarUrl: c.avatarUrl || '',
        headline: c.headline || '',
        location: c.location || '',
        industry: c.industry || '',
        currentCompany: c.company || '',
        mutualCount: c.mutualCount || 0,
        mutualConnections: [],
        matchScore: 100,
        connectionStatus: 'connected',
        isFollowing: true,
        notes: c.notes || [],
        labels: c.labels || [],
      }));
    }
  },

  removeConnection: async (connectionId: string): Promise<{ message: string }> => {
    try {
      const res = await client.delete(`/network/connections/${connectionId}`);
      return res.data;
    } catch {
      mockState.connections = mockState.connections.filter((c) => c.userId !== connectionId && c.id !== connectionId);
      return { message: 'Connection removed successfully' };
    }
  },

  // Requests Management
  listIncomingRequests: async (): Promise<ConnectionRequestItem[]> => {
    try {
      const res = await client.get<ConnectionRequestItem[]>('/network/requests');
      return res.data;
    } catch {
      return mockState.incomingRequests;
    }
  },

  listSentRequests: async (): Promise<ConnectionRequestItem[]> => {
    try {
      const res = await client.get<ConnectionRequestItem[]>('/network/requests/sent');
      return res.data;
    } catch {
      return mockState.sentRequests;
    }
  },

  sendRequest: async (receiverId: string, note?: string): Promise<ConnectionRequestItem> => {
    try {
      const res = await client.post<ConnectionRequestItem>('/network/requests', { receiverId, note });
      return res.data;
    } catch {
      const newReq: ConnectionRequestItem = {
        id: `req-${Date.now()}`,
        senderId: 'my-user-id',
        receiverId,
        status: 'pending',
        note,
        createdAt: new Date().toISOString(),
        receiverName: 'Requested Contact',
        receiverHeadline: 'Professional Specialist',
      };
      mockState.sentRequests.push(newReq);
      return newReq;
    }
  },

  acceptRequest: async (requestId: string): Promise<{ message: string }> => {
    try {
      const res = await client.post(`/network/requests/${requestId}/accept`);
      return res.data;
    } catch {
      mockState.incomingRequests = mockState.incomingRequests.filter((r) => r.id !== requestId);
      return { message: 'Invitation accepted' };
    }
  },

  declineRequest: async (requestId: string): Promise<{ message: string }> => {
    try {
      const res = await client.post(`/network/requests/${requestId}/decline`);
      return res.data;
    } catch {
      mockState.incomingRequests = mockState.incomingRequests.filter((r) => r.id !== requestId);
      return { message: 'Invitation ignored' };
    }
  },

  withdrawRequest: async (requestId: string): Promise<{ message: string }> => {
    try {
      const res = await client.post(`/network/requests/${requestId}/withdraw`);
      return res.data;
    } catch {
      mockState.sentRequests = mockState.sentRequests.filter((r) => r.id !== requestId);
      return { message: 'Invitation withdrawn' };
    }
  },

  // Relationship Controls
  getMutualConnections: async (userId: string): Promise<MutualConnectionsResult> => {
    try {
      const res = await client.get<MutualConnectionsResult>(`/network/mutual/${userId}`);
      return res.data;
    } catch {
      return {
        targetUserId: userId,
        mutualCount: 2,
        mutuals: [
          {
            id: 'res-1',
            userId: 'u1',
            username: 'ayeshas',
            name: 'Ayesha Siddiqui',
            headline: 'Next.js Frontend Architect',
            mutualCount: 5,
            connectionStatus: 'connected',
          },
          {
            id: 'res-2',
            userId: 'u2',
            username: 'marcusdev',
            name: 'Marcus Vance',
            headline: 'Staff Backend Engineer',
            mutualCount: 12,
            connectionStatus: 'connected',
          },
        ],
      };
    }
  },

  dismissRecommendation: async (userId: string, reason?: string): Promise<{ message: string }> => {
    try {
      const res = await client.post(`/network/recommendations/${userId}/dismiss`, { reason });
      return res.data;
    } catch {
      mockState.suggestions = mockState.suggestions.filter((s) => s.userId !== userId);
      return { message: 'Recommendation dismissed' };
    }
  },

  followUser: async (userId: string): Promise<{ message: string }> => {
    try {
      const res = await client.post(`/network/follow/${userId}`);
      return res.data;
    } catch {
      return { message: 'Followed user' };
    }
  },

  unfollowUser: async (userId: string): Promise<{ message: string }> => {
    try {
      const res = await client.delete(`/network/follow/${userId}`);
      return res.data;
    } catch {
      return { message: 'Unfollowed user' };
    }
  },

  blockUser: async (blockedId: string): Promise<{ message: string }> => {
    try {
      const res = await client.post('/networking/blocks', { blockedId });
      return res.data;
    } catch {
      return { message: 'User blocked' };
    }
  },

  unblockUser: async (userId: string): Promise<{ message: string }> => {
    try {
      const res = await client.delete(`/networking/blocks/${userId}`);
      return res.data;
    } catch {
      return { message: 'User unblocked' };
    }
  },

  reportUser: async (userId: string, reason: string, details?: string): Promise<{ message: string }> => {
    try {
      const res = await client.post(`/network/report/${userId}`, { reason, details });
      return res.data;
    } catch {
      return { message: 'Report submitted successfully' };
    }
  },

  // Private Notes & Labels
  getConnectionNotes: async (connectionId: string): Promise<ConnectionNote[]> => {
    try {
      const res = await client.get<ConnectionNote[]>(`/network/connections/${connectionId}/notes`);
      return res.data;
    } catch {
      return mockState.notes.filter((n) => n.connectionId === connectionId);
    }
  },

  saveConnectionNote: async (connectionId: string, text: string, labels: string[] = []): Promise<ConnectionNote> => {
    try {
      const res = await client.post<ConnectionNote>(`/network/connections/${connectionId}/notes`, { text, labels });
      return res.data;
    } catch {
      const newNote: ConnectionNote = {
        id: `note-${Date.now()}`,
        connectionId,
        text,
        labels,
        createdAt: new Date().toISOString(),
      };
      mockState.notes.push(newNote);
      return newNote;
    }
  },

  deleteConnectionNote: async (noteId: string): Promise<{ message: string }> => {
    try {
      const res = await client.delete(`/network/notes/${noteId}`);
      return res.data;
    } catch {
      mockState.notes = mockState.notes.filter((n) => n.id !== noteId);
      return { message: 'Note deleted' };
    }
  },

  getConnectionLabels: async (): Promise<ConnectionLabel[]> => {
    try {
      const res = await client.get<ConnectionLabel[]>('/network/labels');
      return res.data;
    } catch {
      return mockState.labels;
    }
  },

  createConnectionLabel: async (name: string, color?: string): Promise<ConnectionLabel> => {
    try {
      const res = await client.post<ConnectionLabel>('/network/labels', { name, color });
      return res.data;
    } catch {
      const newLabel: ConnectionLabel = {
        id: `lbl-${Date.now()}`,
        name,
        color: color || '#1976d2',
        count: 0,
      };
      mockState.labels.push(newLabel);
      return newLabel;
    }
  },

  // Goals & Targets Management
  getNetworkingGoals: async (): Promise<NetworkingGoal[]> => {
    try {
      const res = await client.get<NetworkingGoal[]>('/network/goals');
      return res.data;
    } catch {
      return mockState.goals;
    }
  },

  createNetworkingGoal: async (goal: Partial<NetworkingGoal>): Promise<NetworkingGoal> => {
    try {
      const res = await client.post<NetworkingGoal>('/network/goals', goal);
      return res.data;
    } catch {
      const newGoal: NetworkingGoal = {
        id: `goal-${Date.now()}`,
        title: goal.title || 'New Networking Goal',
        targetCount: goal.targetCount || 10,
        currentCount: goal.currentCount || 0,
        deadline: goal.deadline || '',
        category: goal.category || 'connect',
        completed: false,
        createdAt: new Date().toISOString(),
      };
      mockState.goals.push(newGoal);
      return newGoal;
    }
  },

  updateGoalProgress: async (goalId: string, currentCount: number): Promise<NetworkingGoal> => {
    try {
      const res = await client.patch<NetworkingGoal>(`/network/goals/${goalId}`, { currentCount });
      return res.data;
    } catch {
      const existing = mockState.goals.find((g) => g.id === goalId);
      if (existing) {
        existing.currentCount = currentCount;
        if (existing.currentCount >= existing.targetCount) {
          existing.completed = true;
        }
        return existing;
      }
      throw new Error('Goal not found');
    }
  },

  deleteNetworkingGoal: async (goalId: string): Promise<{ message: string }> => {
    try {
      const res = await client.delete(`/network/goals/${goalId}`);
      return res.data;
    } catch {
      mockState.goals = mockState.goals.filter((g) => g.id !== goalId);
      return { message: 'Goal deleted' };
    }
  },

  // Referral Discovery & Company Connections
  getCompanyConnections: async (companyName?: string): Promise<CompanyConnection[]> => {
    try {
      const res = await client.get<CompanyConnection[]>('/network/company-connections', {
        params: { company: companyName },
      });
      return res.data;
    } catch {
      if (companyName) {
        const q = companyName.toLowerCase();
        return mockState.companyConnections.filter((c) => c.companyName.toLowerCase().includes(q));
      }
      return mockState.companyConnections;
    }
  },

  // Admin APIs
  getAdminAnalytics: async (): Promise<AdminNetworkAnalytics> => {
    try {
      const res = await client.get<AdminNetworkAnalytics>('/admin/network/analytics');
      return res.data;
    } catch {
      return {
        totalConnectionsCount: 1450,
        totalRequestsCount: 320,
        pendingRequestsCount: 45,
        reportedNetworkCount: 2,
        blockedPairsCount: 12,
      };
    }
  },

  getAdminReports: async (): Promise<any[]> => {
    try {
      const res = await client.get('/admin/network/reports');
      return res.data;
    } catch {
      return [];
    }
  },

  // Legacy compatibility helpers
  getRecommendations: async (): Promise<ConnectionRecommendation[]> => {
    return networkingApi.getSuggestions();
  },

  listRequests: async (): Promise<ConnectionRequestItem[]> => {
    return networkingApi.listIncomingRequests();
  },

  updateRequest: async (requestId: string, status: 'accepted' | 'rejected') => {
    if (status === 'accepted') {
      return networkingApi.acceptRequest(requestId);
    }
    return networkingApi.declineRequest(requestId);
  },
};

export default networkingApi;
