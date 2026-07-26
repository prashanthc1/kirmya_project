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
    const response = await client.post('/search/candidates', criteria);
    return response.data;
  },

  getHistory: async () => {
    const response = await client.get('/search/history');
    return response.data;
  },

  saveCandidate: async (payload: { candidateId: string; listName: string }) => {
    const response = await client.post('/search/saved', payload);
    return response.data;
  },

  getSavedCandidates: async () => {
    const response = await client.get('/search/saved');
    return response.data;
  },

  removeSavedCandidate: async (bookmarkId: string) => {
    const response = await client.delete(`/search/saved/${bookmarkId}`);
    return response.data;
  },

  addNote: async (payload: { candidateId: string; notes: string }) => {
    const response = await client.post('/search/notes', payload);
    return response.data;
  },

  getNotes: async (candidateId: string) => {
    const response = await client.get(`/search/notes/${candidateId}`);
    return response.data;
  },

  contactCandidate: async (payload: { candidateId: string; subject: string; body: string }) => {
    const response = await client.post('/search/contact', payload);
    return response.data;
  },
};
export default candidateSearchApi;
