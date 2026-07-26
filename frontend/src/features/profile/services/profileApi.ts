import axios from 'axios';

// Local dev Gin backend API address
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Default mock UUID for sandbox profiles testing
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject Authorization token
client.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

export const profileApi = {
  getMockUserId: () => MOCK_USER_ID,

  getMyProfile: async () => {
    const response = await client.get('/profiles/me');
    return response.data;
  },

  getPublicProfile: async (userId: string) => {
    const response = await client.get(`/profiles/${userId}`);
    return response.data;
  },

  updateProfile: async (data: {
    headline: string;
    summary: string;
    availabilityStatus: string;
    volunteering: string;
    publications: string;
    licenses: string;
  }) => {
    const response = await client.put('/profiles/me', data);
    return response.data;
  },

  addSkill: async (name: string, proficiencyLevel: string) => {
    const response = await client.post('/profiles/me/skills', { name, proficiencyLevel });
    return response.data;
  },

  deleteSkill: async (id: string) => {
    const response = await client.delete(`/profiles/me/skills/${id}`);
    return response.data;
  },

  addCertification: async (data: {
    name: string;
    issuingOrganization: string;
    issueDate?: string;
    expirationDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }) => {
    const response = await client.post('/profiles/me/certifications', data);
    return response.data;
  },

  deleteCertification: async (id: string) => {
    const response = await client.delete(`/profiles/me/certifications/${id}`);
    return response.data;
  },

  addProject: async (data: {
    title: string;
    description?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await client.post('/profiles/me/projects', data);
    return response.data;
  },

  deleteProject: async (id: string) => {
    const response = await client.delete(`/profiles/me/projects/${id}`);
    return response.data;
  },

  addLanguage: async (name: string, proficiency: string) => {
    const response = await client.post('/profiles/me/languages', { name, proficiency });
    return response.data;
  },

  deleteLanguage: async (id: string) => {
    const response = await client.delete(`/profiles/me/languages/${id}`);
    return response.data;
  },

  addAchievement: async (data: {
    title: string;
    description?: string;
    dateAchieved?: string;
  }) => {
    const response = await client.post('/profiles/me/achievements', data);
    return response.data;
  },

  deleteAchievement: async (id: string) => {
    const response = await client.delete(`/profiles/me/achievements/${id}`);
    return response.data;
  },

  getPreferences: async () => {
    const response = await client.get('/profiles/me/preferences');
    return response.data;
  },

  updatePreferences: async (profileVisibility: string) => {
    const response = await client.put('/profiles/me/preferences', { profileVisibility });
    return response.data;
  },
};
