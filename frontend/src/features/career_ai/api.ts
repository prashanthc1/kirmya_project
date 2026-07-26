import axios from 'axios';
import {
  GenerateCareerPayload,
  ResumeCritiquePayload,
  SkillGapPayload,
  JobGuidancePayload,
  InterviewPrepPayload,
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
  return config;
});

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
