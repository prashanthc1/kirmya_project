import { apiClient } from '@/services/api';
import {
  GenerateCareerPayload,
  ResumeCritiquePayload,
  SkillGapPayload,
  JobGuidancePayload,
  InterviewPrepPayload,
} from './types';

const client = apiClient;

export const careerAIApi = {
  generateCareerAdvice: async (payload: GenerateCareerPayload) => {
    const response = await client.post('/career-ai/recommendations', payload);
    return response.data;
  },

  analyzeResume: async (payload: ResumeCritiquePayload) => {
    const response = await client.post('/career-ai/resume-feedback', payload);
    return response.data;
  },

  identifySkillGaps: async (payload: SkillGapPayload) => {
    const response = await client.post('/career-ai/skill-gap', payload);
    return response.data;
  },

  generateJobGuidance: async (payload: JobGuidancePayload) => {
    const response = await client.post('/career-ai/job-guidance', payload);
    return response.data;
  },

  generateInterviewPrep: async (payload: InterviewPrepPayload) => {
    const response = await client.post('/career-ai/interview-prep', payload);
    return response.data;
  },

  getUserRecommendations: async () => {
    const response = await client.get('/career-ai/recommendations');
    return response.data;
  },

  getUserUsage: async () => {
    const response = await client.get('/career-ai/usage');
    return response.data;
  },
};

export default careerAIApi;
