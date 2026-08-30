import { apiClient } from '@/services/api';
import { SubmitTestPayload } from './types';

const client = apiClient;

export const assessmentApi = {
  getAssessments: async (params?: { category?: string; level?: string }) => {
    const response = await client.get('/assessments', { params });
    return response.data;
  },

  getAssessmentByID: async (id: string) => {
    const response = await client.get(`/assessments/${id}`);
    return response.data;
  },

  submitAssessment: async (id: string, payload: SubmitTestPayload) => {
    const response = await client.post(`/assessments/${id}/submit`, payload);
    return response.data;
  },

  getUserResults: async () => {
    const response = await client.get('/assessments/results');
    return response.data;
  },

  getUserBadges: async () => {
    const response = await client.get('/assessments/badges');
    return response.data;
  },
};

export default assessmentApi;
