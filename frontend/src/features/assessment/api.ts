import axios from 'axios';
import { SubmitTestPayload } from './types';

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
