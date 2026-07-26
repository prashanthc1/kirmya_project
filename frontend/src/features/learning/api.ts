import axios from 'axios';
import { SubmitAssessmentPayload, UpdateProgressPayload } from './types';

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

export const learningApi = {
  getCourses: async (params?: { category?: string; provider?: string; level?: string }) => {
    const response = await client.get('/learning/courses', { params });
    return response.data;
  },

  getCourseByID: async (id: string) => {
    const response = await client.get(`/learning/courses/${id}`);
    return response.data;
  },

  getLearningPaths: async (category?: string) => {
    const response = await client.get('/learning/paths', { params: { category } });
    return response.data;
  },

  enroll: async (courseId: string, learningPathId?: string) => {
    const response = await client.post('/learning/enroll', {
      course_id: courseId,
      learning_path_id: learningPathId,
    });
    return response.data;
  },

  updateProgress: async (payload: UpdateProgressPayload) => {
    const response = await client.post('/learning/progress', payload);
    return response.data;
  },

  getUserProgress: async () => {
    const response = await client.get('/learning/progress');
    return response.data;
  },

  getCertificates: async () => {
    const response = await client.get('/learning/certificates');
    return response.data;
  },

  submitSkillAssessment: async (payload: SubmitAssessmentPayload) => {
    const response = await client.post('/learning/assessment', payload);
    return response.data;
  },
};

export default learningApi;
