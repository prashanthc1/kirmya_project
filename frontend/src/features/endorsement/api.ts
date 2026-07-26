import axios from 'axios';
import {
  CreateReferencePayload,
  EndorseSkillPayload,
  ProfessionalRecommendation,
  ProfessionalReference,
  SkillEndorsementGroup,
  SubmitRecommendationPayload,
  UpdateRecommendationStatusPayload,
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

export const endorsementApi = {
  endorseSkill: async (payload: EndorseSkillPayload) => {
    const response = await client.post('/endorsements/skills', payload);
    return response.data;
  },

  getUserEndorsements: async (userId?: string): Promise<{ data: SkillEndorsementGroup[]; count: number }> => {
    const response = await client.get('/endorsements/skills', {
      params: { user_id: userId || MOCK_USER_ID },
    });
    return response.data;
  },

  submitRecommendation: async (payload: SubmitRecommendationPayload) => {
    const response = await client.post('/endorsements/recommendations', payload);
    return response.data;
  },

  getRecommendationsForUser: async (userId?: string): Promise<{ data: ProfessionalRecommendation[]; count: number }> => {
    const response = await client.get('/endorsements/recommendations', {
      params: { user_id: userId || MOCK_USER_ID },
    });
    return response.data;
  },

  updateRecommendationStatus: async (recId: string, payload: UpdateRecommendationStatusPayload) => {
    const response = await client.put(`/endorsements/recommendations/${recId}/status`, payload);
    return response.data;
  },

  createReference: async (payload: CreateReferencePayload) => {
    const response = await client.post('/endorsements/references', payload);
    return response.data;
  },

  getUserReferences: async (userId?: string): Promise<{ data: ProfessionalReference[]; count: number }> => {
    const response = await client.get('/endorsements/references', {
      params: { user_id: userId || MOCK_USER_ID },
    });
    return response.data;
  },
};

export default endorsementApi;
