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

export const analyticsApi = {
  getOverview: async () => {
    const response = await client.get('/analytics/overview');
    return response.data;
  },

  getTrends: async (days: number = 7) => {
    const response = await client.get(`/analytics/trends?days=${days}`);
    return response.data;
  },

  trackEvent: async (eventType: string, eventMetadata: Record<string, any> = {}) => {
    const response = await client.post('/analytics/track', { eventType, eventMetadata });
    return response.data;
  },
};
