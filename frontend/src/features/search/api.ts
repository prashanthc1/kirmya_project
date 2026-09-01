import { authApiClient } from '../../services/authService';
import {
  ReindexPayload,
  SaveSearchPreferencePayload,
  SearchHistoryItem,
  SearchResponse,
  SearchSuggestion,
} from './types';

export * from './types';

export const searchApi = {
  search: async (q: string, category?: string): Promise<SearchResponse> => {
    const response = await authApiClient.get<SearchResponse>('/unified-search', {
      params: { q, category: category || 'all' },
    });
    return response.data;
  },

  getSuggestions: async (q: string): Promise<{ suggestions: SearchSuggestion[]; count: number }> => {
    const response = await authApiClient.get<{ suggestions: SearchSuggestion[]; count: number }>('/unified-search/suggestions', {
      params: { q },
    });
    return response.data;
  },

  getUserHistory: async (): Promise<{ data: SearchHistoryItem[]; count: number }> => {
    const response = await authApiClient.get<{ data: SearchHistoryItem[]; count: number }>('/unified-search/history');
    return response.data;
  },

  savePreference: async (payload: SaveSearchPreferencePayload): Promise<{ message: string }> => {
    const response = await authApiClient.post<{ message: string }>('/unified-search/preferences', payload);
    return response.data;
  },

  deleteHistoryItem: async (id: string): Promise<{ message: string }> => {
    const response = await authApiClient.delete<{ message: string }>(`/unified-search/history/${id}`);
    return response.data;
  },

  clearHistory: async (): Promise<{ message: string }> => {
    const response = await authApiClient.delete<{ message: string }>('/unified-search/history');
    return response.data;
  },

  reindex: async (payload: ReindexPayload): Promise<{ message: string; status: string }> => {
    const response = await authApiClient.post<{ message: string; status: string }>('/unified-search/reindex', payload);
    return response.data;
  },
};

export default searchApi;
