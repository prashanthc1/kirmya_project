import { authApiClient } from '../../services/authService';
import {
  TrackEventPayload,
  UnifiedRecommendationsResponse,
  UserPreference,
} from './types';

export * from './types';

const apiClient = authApiClient;

export const recommendationApi = {
  getUnifiedRecommendations: async (): Promise<UnifiedRecommendationsResponse> => {
    const response = await apiClient.get<UnifiedRecommendationsResponse>('/recommendation-engine/unified');
    return response.data;
  },

  trackEvent: async (payload: TrackEventPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/recommendation-engine/events', payload);
    return response.data;
  },

  getPreferences: async (): Promise<UserPreference> => {
    const response = await apiClient.get<UserPreference>('/recommendation-engine/preferences');
    return response.data;
  },

  getCareerGaps: async (): Promise<any> => {
    const response = await apiClient.get('/recommendation-engine/career-gaps');
    return response.data;
  },

  getAdminConfig: async (): Promise<any> => {
    const response = await apiClient.get('/admin/recommendations/config');
    return response.data;
  },

  updateAdminConfig: async (payload: any): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>('/admin/recommendations/config', payload);
    return response.data;
  },

  getAdminMetrics: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/admin/recommendations/metrics');
    return response.data;
  },
};

export default recommendationApi;
