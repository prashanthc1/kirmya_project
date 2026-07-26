import axios from 'axios';
import {
  AIJobMatch,
  FeedbackType,
  MatchingFeedback,
} from './types';

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

export const matchingApi = {
  getUserMatches: async (): Promise<{ data: AIJobMatch[]; count: number }> => {
    const response = await client.get('/jobs/matches');
    return response.data;
  },

  getMatchByID: async (id: string): Promise<AIJobMatch> => {
    const response = await client.get(`/jobs/matches/${id}`);
    return response.data;
  },

  submitFeedback: async (id: string, feedbackType: FeedbackType, notes?: string): Promise<{ message: string; feedback: MatchingFeedback }> => {
    const response = await client.post(`/jobs/matches/${id}/feedback`, {
      feedback_type: feedbackType,
      notes,
    });
    return response.data;
  },
};

export default matchingApi;
