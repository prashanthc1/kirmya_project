import { authApiClient } from '../../../services/api';

export const candidateSearchApi = {
  searchCandidates: async (criteria: {
    query: string;
    filters: {
      skills: string[];
      experienceMin: number;
      experienceMax: number;
      location: string;
      availability: string;
      salaryMin: number;
      salaryMax: number;
      education: string;
      certifications: string[];
      industry: string;
      jobTitle: string;
    };
  }) => {
    const response = await authApiClient.post('/search/candidates', criteria);
    return response.data;
  },

  getHistory: async () => {
    const response = await authApiClient.get('/search/history');
    return response.data;
  },

  saveCandidate: async (payload: { candidateId: string; listName: string }) => {
    const response = await authApiClient.post('/search/saved', payload);
    return response.data;
  },

  getSavedCandidates: async () => {
    const response = await authApiClient.get('/search/saved');
    return response.data;
  },

  removeSavedCandidate: async (bookmarkId: string) => {
    const response = await authApiClient.delete(`/search/saved/${bookmarkId}`);
    return response.data;
  },

  addNote: async (payload: { candidateId: string; notes: string }) => {
    const response = await authApiClient.post('/search/notes', payload);
    return response.data;
  },

  getNotes: async (candidateId: string) => {
    const response = await authApiClient.get(`/search/notes/${candidateId}`);
    return response.data;
  },

  contactCandidate: async (payload: { candidateId: string; subject: string; body: string }) => {
    const response = await authApiClient.post('/search/contact', payload);
    return response.data;
  },
};
export default candidateSearchApi;
