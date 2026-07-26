import axios from 'axios';
import {
  AICandidateScore,
  AIGeneratedContent,
  RecruiterAISession,
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
