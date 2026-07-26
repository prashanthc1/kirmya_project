import axios from 'axios';
import { AnalyzeResumePayload, ResumeAnalysis } from './types';

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

export const resumeAnalysisApi = {
  analyzeResume: async (payload: AnalyzeResumePayload): Promise<{ message: string; analysis: ResumeAnalysis }> => {
    const response = await client.post('/resume-analysis/analyze', payload);
    return response.data;
  },

  getAnalysisByID: async (id: string): Promise<ResumeAnalysis> => {
    const response = await client.get(`/resume-analysis/${id}`);
    return response.data;
  },

  getUserAnalysisHistory: async (): Promise<{ data: ResumeAnalysis[]; count: number }> => {
    const response = await client.get('/resume-analysis/history');
    return response.data;
  },
};

export default resumeAnalysisApi;
