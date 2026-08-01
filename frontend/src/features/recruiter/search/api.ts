import axios from 'axios';
import {
  CandidateSearchQuery,
  CandidateSearchResponse,
  CandidateSearchResultItem,
  TalentPoolDTO,
  SavedSearchDTO,
  CandidateComparisonItem,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const candidateSearchApi = {
  searchCandidates: async (params?: CandidateSearchQuery): Promise<CandidateSearchResponse> => {
    const res = await apiClient.get<CandidateSearchResponse>('/recruiter/candidates/search', { params });
    return res.data;
  },

  getFilterFacets: async (): Promise<Record<string, string[]>> => {
    const res = await apiClient.get<Record<string, string[]>>('/recruiter/candidates/filters');
    return res.data;
  },

  getCandidateDetail: async (id: string): Promise<CandidateSearchResultItem> => {
    const res = await apiClient.get<CandidateSearchResultItem>(`/recruiter/candidates/${id}`);
    return res.data;
  },

  saveCandidate: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/candidates/${id}/save`);
    return res.data;
  },

  unsaveCandidate: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/recruiter/candidates/${id}/save`);
    return res.data;
  },

  getSavedCandidates: async (): Promise<CandidateSearchResultItem[]> => {
    const res = await apiClient.get<CandidateSearchResultItem[]>('/recruiter/candidates/saved');
    return res.data;
  },

  messageCandidate: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/candidates/${id}/message`);
    return res.data;
  },

  connectCandidate: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/candidates/${id}/connect`);
    return res.data;
  },

  getSavedSearches: async (): Promise<SavedSearchDTO[]> => {
    const res = await apiClient.get<SavedSearchDTO[]>('/recruiter/saved-searches');
    return res.data;
  },

  createSavedSearch: async (payload: { search_name: string; query?: string; filters?: any; alert_frequency?: string }): Promise<SavedSearchDTO> => {
    const res = await apiClient.post<SavedSearchDTO>('/recruiter/saved-searches', payload);
    return res.data;
  },

  deleteSavedSearch: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/recruiter/saved-searches/${id}`);
    return res.data;
  },

  getTalentPools: async (): Promise<TalentPoolDTO[]> => {
    const res = await apiClient.get<TalentPoolDTO[]>('/recruiter/talent-pools');
    return res.data;
  },

  createTalentPool: async (payload: { name: string; description?: string; shared_with_team?: boolean }): Promise<TalentPoolDTO> => {
    const res = await apiClient.post<TalentPoolDTO>('/recruiter/talent-pools', payload);
    return res.data;
  },

  deleteTalentPool: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/recruiter/talent-pools/${id}`);
    return res.data;
  },

  addCandidateToPool: async (poolId: string, candidateId: string, notes?: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/talent-pools/${poolId}/candidates`, { candidate_id: candidateId, notes });
    return res.data;
  },

  removeCandidateFromPool: async (poolId: string, candidateId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/recruiter/talent-pools/${poolId}/candidates/${candidateId}`);
    return res.data;
  },

  compareCandidates: async (candidateIds: string[]): Promise<CandidateComparisonItem[]> => {
    const res = await apiClient.post<CandidateComparisonItem[]>('/recruiter/candidates/compare', { candidate_ids: candidateIds });
    return res.data;
  },

  getRecommendations: async (): Promise<CandidateSearchResultItem[]> => {
    const res = await apiClient.get<CandidateSearchResultItem[]>('/recruiter/candidates/recommendations');
    return res.data;
  },
};
