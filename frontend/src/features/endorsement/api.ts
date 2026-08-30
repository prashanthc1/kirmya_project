import { apiClient } from '@/services/api';
import {
  CreateReferencePayload,
  EndorseSkillPayload,
  ProfessionalRecommendation,
  ProfessionalReference,
  SkillEndorsementGroup,
  SubmitRecommendationPayload,
  UpdateRecommendationStatusPayload,
} from './types';

const client = apiClient;

export const endorsementApi = {
  endorseSkill: async (payload: EndorseSkillPayload) => {
    const response = await client.post('/endorsements/skills', payload);
    return response.data;
  },

  getUserEndorsements: async (userId?: string): Promise<{ data: SkillEndorsementGroup[]; count: number }> => {
    const response = await client.get('/endorsements/skills', {
      params: userId ? { user_id: userId } : undefined,
    });
    return response.data;
  },

  submitRecommendation: async (payload: SubmitRecommendationPayload) => {
    const response = await client.post('/endorsements/recommendations', payload);
    return response.data;
  },

  getRecommendationsForUser: async (userId?: string): Promise<{ data: ProfessionalRecommendation[]; count: number }> => {
    const response = await client.get('/endorsements/recommendations', {
      params: userId ? { user_id: userId } : undefined,
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
      params: userId ? { user_id: userId } : undefined,
    });
    return response.data;
  },
};

export default endorsementApi;
