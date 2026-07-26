import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

export const networkingApi = {
  getMockUserId: () => MOCK_USER_ID,

  getRecommendations: async () => {
    const response = await client.get('/networking/recommendations');
    return response.data;
  },

  listConnections: async () => {
    const response = await client.get('/networking/connections');
    return response.data;
  },

  listRequests: async () => {
    const response = await client.get('/networking/requests');
    return response.data;
  },

  sendRequest: async (receiverId: string) => {
    const response = await client.post('/networking/requests', { receiverId });
    return response.data;
  },

  updateRequest: async (requestId: string, status: 'accepted' | 'rejected') => {
    const response = await client.put(`/networking/requests/${requestId}`, { status });
    return response.data;
  },

  blockUser: async (blockedId: string) => {
    const response = await client.post('/networking/blocks', { blockedId });
    return response.data;
  },

  unblockUser: async (userId: string) => {
    const response = await client.delete(`/networking/blocks/${userId}`);
    return response.data;
  },
};
