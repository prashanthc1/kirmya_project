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

export const resumeApi = {
  listResumes: async () => {
    const response = await client.get('/resumes');
    return response.data;
  },

  getResume: async (id: string) => {
    const response = await client.get(`/resumes/${id}`);
    return response.data;
  },

  createResume: async (title: string, templateName: string) => {
    const response = await client.post('/resumes', { title, templateName });
    return response.data;
  },

  updateResumeSections: async (id: string, sections: { sectionType: string; content: string; sortOrder: number }[]) => {
    const response = await client.put(`/resumes/${id}`, { sections });
    return response.data;
  },

  deleteResume: async (id: string) => {
    const response = await client.delete(`/resumes/${id}`);
    return response.data;
  },

  duplicateResume: async (id: string) => {
    const response = await client.post(`/resumes/${id}/duplicate`);
    return response.data;
  },

  setDefaultResume: async (id: string) => {
    const response = await client.put(`/resumes/${id}/default`);
    return response.data;
  },

  listVersions: async (id: string) => {
    const response = await client.get(`/resumes/${id}/versions`);
    return response.data;
  },
};
