import { authApiClient } from '../../../services/authService';

const client = authApiClient;

export interface PeopleSearchResult {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  headline: string;
  currentPosition: string;
  location: string;
  industry: string;
  openToWork: boolean;
  mutualCount: number;
  mutualConnections: string[];
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';
  isFollowing: boolean;
  verificationStatus?: string;
}

export interface ConnectionRecommendation {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  headline: string;
  location: string;
  industry: string;
  currentCompany?: string;
  mutualCount: number;
  mutualConnections: string[];
  matchScore: number;
  reason?: string;
  connectionStatus?: string;
  isFollowing?: boolean;
}

export interface ConnectionRequestItem {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  note?: string;
  createdAt: string;
  senderName?: string;
  senderHeadline?: string;
  senderAvatarUrl?: string;
  receiverName?: string;
  receiverHeadline?: string;
}

export interface NetworkGrowthStats {
  totalConnections: number;
  pendingReceived: number;
  pendingSent: number;
  networkGrowthThisMonth: number;
  profileViews: number;
  searchAppearances: number;
}

export interface AdminNetworkAnalytics {
  totalConnectionsCount: number;
  totalRequestsCount: number;
  pendingRequestsCount: number;
  reportedNetworkCount: number;
  blockedPairsCount: number;
}

export const networkingApi = {
  // People Search & Discovery
  searchPeople: async (params?: Record<string, any>): Promise<PeopleSearchResult[]> => {
    const res = await client.get<PeopleSearchResult[]>('/people/search', { params });
    return res.data;
  },

  getSuggestions: async (): Promise<ConnectionRecommendation[]> => {
    const res = await client.get<ConnectionRecommendation[]>('/people/suggestions');
    return res.data;
  },

  // Network Overview & Connections
  getNetworkStats: async (): Promise<NetworkGrowthStats> => {
    const res = await client.get<NetworkGrowthStats>('/network');
    return res.data;
  },

  listConnections: async (): Promise<ConnectionRecommendation[]> => {
    const res = await client.get<ConnectionRecommendation[]>('/network/connections');
    return res.data;
  },

  removeConnection: async (connectionId: string): Promise<{ message: string }> => {
    const res = await client.delete(`/network/connections/${connectionId}`);
    return res.data;
  },

  // Requests Management
  listIncomingRequests: async (): Promise<ConnectionRequestItem[]> => {
    const res = await client.get<ConnectionRequestItem[]>('/network/requests');
    return res.data;
  },

  listSentRequests: async (): Promise<ConnectionRequestItem[]> => {
    const res = await client.get<ConnectionRequestItem[]>('/network/requests/sent');
    return res.data;
  },

  sendRequest: async (receiverId: string, note?: string): Promise<ConnectionRequestItem> => {
    const res = await client.post<ConnectionRequestItem>('/network/requests', { receiverId, note });
    return res.data;
  },

  acceptRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await client.post(`/network/requests/${requestId}/accept`);
    return res.data;
  },

  declineRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await client.post(`/network/requests/${requestId}/decline`);
    return res.data;
  },

  withdrawRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await client.post(`/network/requests/${requestId}/withdraw`);
    return res.data;
  },

  // Relationship Controls
  getMutualConnections: async (userId: string): Promise<{ targetUserId: string; mutualCount: number; mutuals: PeopleSearchResult[] }> => {
    const res = await client.get(`/network/mutual/${userId}`);
    return res.data;
  },

  dismissRecommendation: async (userId: string, reason?: string): Promise<{ message: string }> => {
    const res = await client.post(`/network/recommendations/${userId}/dismiss`, { reason });
    return res.data;
  },

  followUser: async (userId: string): Promise<{ message: string }> => {
    const res = await client.post(`/network/follow/${userId}`);
    return res.data;
  },

  unfollowUser: async (userId: string): Promise<{ message: string }> => {
    const res = await client.delete(`/network/follow/${userId}`);
    return res.data;
  },

  blockUser: async (blockedId: string): Promise<{ message: string }> => {
    const res = await client.post('/networking/blocks', { blockedId });
    return res.data;
  },

  unblockUser: async (userId: string): Promise<{ message: string }> => {
    const res = await client.delete(`/networking/blocks/${userId}`);
    return res.data;
  },

  reportUser: async (userId: string, reason: string, details?: string): Promise<{ message: string }> => {
    const res = await client.post(`/network/report/${userId}`, { reason, details });
    return res.data;
  },

  // Admin APIs
  getAdminAnalytics: async (): Promise<AdminNetworkAnalytics> => {
    const res = await client.get<AdminNetworkAnalytics>('/admin/network/analytics');
    return res.data;
  },

  getAdminReports: async (): Promise<any[]> => {
    const res = await client.get('/admin/network/reports');
    return res.data;
  },

  // Legacy compatibility helpers
  getRecommendations: async (): Promise<ConnectionRecommendation[]> => {
    const res = await client.get<ConnectionRecommendation[]>('/networking/recommendations');
    return res.data;
  },

  listRequests: async (): Promise<ConnectionRequestItem[]> => {
    const res = await client.get<ConnectionRequestItem[]>('/networking/requests');
    return res.data;
  },

  updateRequest: async (requestId: string, status: 'accepted' | 'rejected') => {
    const res = await client.put(`/networking/requests/${requestId}`, { status });
    return res.data;
  },
};
