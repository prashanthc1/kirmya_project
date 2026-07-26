import axios from 'axios';
import {
  SaveSearchPreferencePayload,
  SearchHistoryItem,
  SearchResponse,
  SearchSuggestion,
} from './types';

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
  const tenantID = localStorage.getItem('active_tenant_id') || '00000000-0000-0000-0000-000000000000';
  config.headers['X-Tenant-ID'] = tenantID;
  return config;
});

export const searchApi = {
  search: async (q: string, category?: string): Promise<SearchResponse> => {
    const response = await client.get('/search', {
      params: { q, category: category || 'all' },
    });
    return response.data;
  },

  getSuggestions: async (q: string): Promise<{ suggestions: SearchSuggestion[]; count: number }> => {
    const response = await client.get('/search/suggestions', {
      params: { q },
    });
    return response.data;
  },

  getUserHistory: async (): Promise<{ data: SearchHistoryItem[]; count: number }> => {
    const response = await client.get('/search/history');
    return response.data;
  },

  savePreference: async (payload: SaveSearchPreferencePayload): Promise<{ message: string }> => {
    const response = await client.post('/search/preferences', payload);
    return response.data;
  },
};

export default searchApi;
