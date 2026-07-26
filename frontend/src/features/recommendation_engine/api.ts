import axios from 'axios';
import {
  TrackEventPayload,
  UnifiedRecommendationsResponse,
  UserPreference,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

export const recommendationApi = {
  getUnifiedRecommendations: async (): Promise<UnifiedRecommendationsResponse> => {
    const response = await client.get('/recommendations/unified');
    return response.data;
  },

  trackEvent: async (payload: TrackEventPayload): Promise<{ message: string }> => {
    const response = await client.post('/recommendations/events', payload);
    return response.data;
  },

  getPreferences: async (): Promise<UserPreference> => {
    const response = await client.get('/recommendations/preferences');
    return response.data;
  },
};

export default recommendationApi;
