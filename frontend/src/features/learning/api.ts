import { apiClient } from '@/services/api';
import { SubmitAssessmentPayload, UpdateProgressPayload } from './types';

const client = apiClient;

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
