import axios from 'axios';
import { AdminAnalytics, RecruiterAnalytics, TrackEventPayload, UserAnalytics } from './types';

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
  const tenantID = localStorage.getItem('active_tenant_id') || '00000000-0000-0000-0000-000000000000';
  config.headers['X-Tenant-ID'] = tenantID;
  return config;
});

export const analyticsApi = {
  trackEvent: async (payload: TrackEventPayload): Promise<{ message: string }> => {
    const response = await client.post('/analytics/events', payload);
    return response.data;
  },

  getAdminAnalytics: async (): Promise<AdminAnalytics> => {
    const response = await client.get('/analytics/admin');
    return response.data;
  },

  getRecruiterAnalytics: async (): Promise<RecruiterAnalytics> => {
    const response = await client.get('/analytics/recruiter');
    return response.data;
  },

  getUserAnalytics: async (): Promise<UserAnalytics> => {
    const response = await client.get('/analytics/user');
    return response.data;
  },
};

export default analyticsApi;
