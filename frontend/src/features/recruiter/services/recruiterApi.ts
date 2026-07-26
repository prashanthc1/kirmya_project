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

export const recruiterApi = {
  getProfile: async () => {
    const response = await client.get('/recruiter/profile');
    return response.data;
  },

  createJob: async (payload: {
    title: string;
    description: string;
    department: string;
    location: string;
    salaryRange: string;
  }) => {
    const response = await client.post('/recruiter/jobs', payload);
    return response.data;
  },

  getJobs: async () => {
    const response = await client.get('/recruiter/jobs');
    return response.data;
  },

  getPipeline: async (jobID: string) => {
    const response = await client.get(`/recruiter/pipeline/${jobID}`);
    return response.data;
  },

  updatePipelineStage: async (
    pipelineID: string,
    payload: {
      stage: string;
      notes?: string;
      interviewScheduledAt?: string;
    }
  ) => {
    const response = await client.put(`/recruiter/pipeline/${pipelineID}`, payload);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await client.get('/recruiter/analytics');
    return response.data;
  },
};
export default recruiterApi;
