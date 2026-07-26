import axios from 'axios';
import {
  AIConversation,
  AIMessage,
  AIUserContext,
  CareerPlan,
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

export const companionApi = {
  createConversation: async (title?: string, mode?: string): Promise<{ conversation: AIConversation }> => {
    const response = await client.post('/career-companion/conversations', { title, mode });
    return response.data;
  },

  sendMessage: async (conversationID: string, content: string): Promise<{ message: AIMessage }> => {
    const response = await client.post(`/career-companion/conversations/${conversationID}/messages`, { content });
    return response.data;
  },

  getUserConversations: async (): Promise<{ data: AIConversation[]; count: number }> => {
    const response = await client.get('/career-companion/conversations');
    return response.data;
  },

  generateRoadmap: async (targetRole: string, currentLevel?: string): Promise<{ plan: CareerPlan }> => {
    const response = await client.post('/career-companion/roadmap', {
      target_role: targetRole,
      current_level: currentLevel,
    });
    return response.data;
  },

  getLatestCareerPlan: async (): Promise<CareerPlan> => {
    const response = await client.get('/career-companion/roadmap');
    return response.data;
  },

  getUserContext: async (): Promise<AIUserContext> => {
    const response = await client.get('/career-companion/context');
    return response.data;
  },
};

export default companionApi;
