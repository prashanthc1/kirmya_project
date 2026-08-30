import { apiClient } from '@/services/api';
import {
  AIConversation,
  AIMessage,
  AIUserContext,
  CareerPlan,
} from './types';

const client = apiClient;

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
