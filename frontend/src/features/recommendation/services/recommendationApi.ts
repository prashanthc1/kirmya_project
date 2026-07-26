import axios from 'axios';

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

export const recommendationApi = {
  getMockUserId: () => MOCK_USER_ID,

  getRecommendations: async () => {
    const response = await client.get('/recommendations');
    return response.data;
  },

  submitFeedback: async (id: string, feedbackType: string, comments: string = '') => {
    const response = await client.post(`/recommendations/${id}/feedback`, { feedbackType, comments });
    return response.data;
  },

  getPreferences: async () => {
    const response = await client.get('/recommendations/preferences');
    return response.data;
  },

  updatePreferences: async (data: {
    preferredTitles: string[];
    preferredLocations: string[];
    preferredIndustries: string[];
    minSalary: number;
    currency: string;
  }) => {
    const response = await client.put('/recommendations/preferences', data);
    return response.data;
  },
};
