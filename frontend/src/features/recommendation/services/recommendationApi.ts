import { authApiClient } from '../../../services/authService';
import {
  FeedResponse,
  JobRecommendation,
  RecommendedCommunity,
  RecommendedPerson,
  UserJobPreferences,
} from '../types';

export * from '../types';

const apiClient = authApiClient;

export const recommendationApi = {
  getMockUserId: () => '00000000-0000-0000-0000-000000000001',

  getFeed: async (params?: { cursor?: string; limit?: number }): Promise<FeedResponse> => {
    const response = await apiClient.get<FeedResponse>('/feed', { params });
    return response.data;
  },

  getRecommendations: async (params?: { page?: number; limit?: number }): Promise<JobRecommendation[]> => {
    const response = await apiClient.get<JobRecommendation[]>('/recommendations', { params });
    return response.data;
  },

  getPeopleRecommendations: async (params?: { limit?: number }): Promise<RecommendedPerson[]> => {
    const response = await apiClient.get<RecommendedPerson[]>('/recommendations/people', { params });
    return response.data;
  },

  getCommunityRecommendations: async (params?: { limit?: number }): Promise<RecommendedCommunity[]> => {
    const response = await apiClient.get<RecommendedCommunity[]>('/recommendations/communities', { params });
    return response.data;
  },

  submitFeedback: async (
    id: string,
    feedbackType: 'like' | 'dislike' | 'dismiss' | 'save',
    comments: string = ''
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/recommendations/${id}/feedback`, {
      feedbackType,
      comments,
    });
    return response.data;
  },

  getPreferences: async (): Promise<UserJobPreferences> => {
    const response = await apiClient.get<UserJobPreferences>('/recommendations/preferences');
    return response.data;
  },

  updatePreferences: async (data: UserJobPreferences): Promise<UserJobPreferences> => {
    const response = await apiClient.put<UserJobPreferences>('/recommendations/preferences', data);
    return response.data;
  },
};

export default recommendationApi;
