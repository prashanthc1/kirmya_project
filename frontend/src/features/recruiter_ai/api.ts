import { apiClient } from '@/services/api';
import {
  AICandidateScore,
  AIGeneratedContent,
  RecruiterAISession,
} from './types';

const client = apiClient;

export const recruiterAIApi = {
  rankCandidates: async (jobID: string): Promise<{ session: RecruiterAISession; candidate_scores: AICandidateScore[]; count: number }> => {
    const response = await client.post('/recruiter-ai/rank-candidates', { job_id: jobID });
    return response.data;
  },

  generateInterviewQuestions: async (candidateID: string, jobID: string): Promise<{ message: string; content: AIGeneratedContent }> => {
    const response = await client.post('/recruiter-ai/interview-questions', {
      candidate_id: candidateID,
      job_id: jobID,
    });
    return response.data;
  },

  optimizeJobDescription: async (rawDescription: string, jobID?: string): Promise<{ message: string; content: AIGeneratedContent }> => {
    const response = await client.post('/recruiter-ai/optimize-jd', {
      job_id: jobID,
      raw_description: rawDescription,
    });
    return response.data;
  },

  draftOutreachEmail: async (candidateID: string, jobID: string, tone?: string): Promise<{ message: string; content: AIGeneratedContent }> => {
    const response = await client.post('/recruiter-ai/outreach-email', {
      candidate_id: candidateID,
      job_id: jobID,
      tone: tone || 'professional',
    });
    return response.data;
  },

  getRecruiterSessions: async (): Promise<{ data: RecruiterAISession[]; count: number }> => {
    const response = await client.get('/recruiter-ai/sessions');
    return response.data;
  },
};

export default recruiterAIApi;
