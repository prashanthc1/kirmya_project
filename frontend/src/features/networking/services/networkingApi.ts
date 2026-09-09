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

// ponytail: Go marshals nil slices as JSON null, so an empty list arrives as `null`
// with a 200 and never hits the catch below. Treat any non-array payload as empty.
const asList = <T,>(data: unknown): T[] => (Array.isArray(data) ? data : []);

export interface AdminNetworkAnalytics {
  totalConnectionsCount: number;
  totalRequestsCount: number;
  pendingRequestsCount: number;
  reportedNetworkCount: number;
  blockedPairsCount: number;
}

export const networkingApi = {
  getMockUserId: () => '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',

  // People Search & Discovery
  searchPeople: async (params?: Record<string, any>): Promise<PeopleSearchResult[]> => {
    const res = await client.get<PeopleSearchResult[]>('/people/search', { params });
    return asList(res.data);
    
  },

  getSuggestions: async (): Promise<ConnectionRecommendation[]> => {
    const res = await client.get<ConnectionRecommendation[]>('/people/suggestions');
    return asList(res.data);
    
  },

  // Network Overview & Connections
  getNetworkStats: async (): Promise<NetworkGrowthStats> => {
    const res = await client.get<NetworkGrowthStats>('/network');
    return res.data;
    
  },

  listConnections: async (params?: Record<string, any>): Promise<any[]> => {
    const res = await client.get('/network/connections', { params });
    return asList(res.data);
    
  },

  removeConnection: async (connectionId: string): Promise<{ message: string }> => {
    const res = await client.delete(`/network/connections/${connectionId}`);
    return res.data;
    
  },

  // Requests Management
  listIncomingRequests: async (): Promise<ConnectionRequestItem[]> => {
    const res = await client.get<ConnectionRequestItem[]>('/network/requests');
    return asList(res.data);
    
  },

  listSentRequests: async (): Promise<ConnectionRequestItem[]> => {
    const res = await client.get<ConnectionRequestItem[]>('/network/requests/sent');
    return asList(res.data);
    
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
  getMutualConnections: async (userId: string): Promise<MutualConnectionsResult> => {
    const res = await client.get<MutualConnectionsResult>(`/network/mutual/${userId}`);
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
    const res = await client.post('/network/blocks', { blockedId });
    return res.data;
    
  },

  unblockUser: async (userId: string): Promise<{ message: string }> => {
    const res = await client.delete(`/network/blocks/${userId}`);
    return res.data;
    
  },

  reportUser: async (userId: string, reason: string, details?: string): Promise<{ message: string }> => {
    const res = await client.post(`/network/report/${userId}`, { reason, details });
    return res.data;
    
  },

  // Private Notes & Labels
  getConnectionNotes: async (connectionId: string): Promise<ConnectionNote[]> => {
    const res = await client.get<ConnectionNote[]>(`/network/connections/${connectionId}/notes`);
    return asList(res.data);
    
  },

  saveConnectionNote: async (connectionId: string, text: string, labels: string[] = []): Promise<ConnectionNote> => {
    const res = await client.post<ConnectionNote>(`/network/connections/${connectionId}/notes`, { text, labels });
    return res.data;
    
  },

  deleteConnectionNote: async (noteId: string): Promise<{ message: string }> => {
    const res = await client.delete(`/network/notes/${noteId}`);
    return res.data;
    
  },

  getConnectionLabels: async (): Promise<ConnectionLabel[]> => {
    const res = await client.get<ConnectionLabel[]>('/network/labels');
    return asList(res.data);
    
  },

  createConnectionLabel: async (name: string, color?: string): Promise<ConnectionLabel> => {
    const res = await client.post<ConnectionLabel>('/network/labels', { name, color });
    return res.data;
    
  },

  // Goals & Targets Management
  getNetworkingGoals: async (): Promise<NetworkingGoal[]> => {
    const res = await client.get<NetworkingGoal[]>('/network/goals');
    return asList(res.data);
    
  },

  createNetworkingGoal: async (goal: Partial<NetworkingGoal>): Promise<NetworkingGoal> => {
    const res = await client.post<NetworkingGoal>('/network/goals', goal);
    return res.data;
    
  },

  updateGoalProgress: async (goalId: string, currentCount: number): Promise<NetworkingGoal> => {
    const res = await client.patch<NetworkingGoal>(`/network/goals/${goalId}`, { currentCount });
    return res.data;
    
  },

  deleteNetworkingGoal: async (goalId: string): Promise<{ message: string }> => {
    const res = await client.delete(`/network/goals/${goalId}`);
    return res.data;
    
  },

  // Referral Discovery & Company Connections
  getCompanyConnections: async (companyName?: string): Promise<CompanyConnection[]> => {
    const res = await client.get<CompanyConnection[]>('/network/company-connections', {
      params: { company: companyName },
    });
    return asList(res.data);
    
  },

  // Admin APIs
  getAdminAnalytics: async (): Promise<AdminNetworkAnalytics> => {
    const res = await client.get<AdminNetworkAnalytics>('/admin/network/analytics');
    return res.data;
    
  },

  getAdminReports: async (): Promise<any[]> => {
    const res = await client.get('/admin/network/reports');
    return asList(res.data);
    
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
