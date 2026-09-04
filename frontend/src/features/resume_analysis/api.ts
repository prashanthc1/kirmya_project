import { apiClient } from '@/services/api';
import { AnalyzeResumePayload, ResumeAnalysis } from './types';

const client = apiClient;

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
