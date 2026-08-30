import { apiClient } from '@/services/api';
import {
  AIJobMatch,
  FeedbackType,
  MatchingFeedback,
} from './types';

const client = apiClient;

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
