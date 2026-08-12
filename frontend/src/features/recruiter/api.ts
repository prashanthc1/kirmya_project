import axios from 'axios';
import {
  RecruiterDashboardOverview,
  RecruiterJob,
  CandidatePipelineItem,
  RecruiterCandidateItem,
  InterviewItem,
  RecruiterAnalytics,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const recruiterApi = {
  getDashboardOverview: async (): Promise<RecruiterDashboardOverview> => {
    const res = await apiClient.get<RecruiterDashboardOverview>('/recruiter/dashboard');
    return res.data;
  },

  submitOnboarding: async (payload: any): Promise<any> => {
    const res = await apiClient.post('/recruiter/onboarding', payload);
    return res.data;
  },

  getJobs: async (): Promise<RecruiterJob[]> => {
    const res = await apiClient.get<RecruiterJob[]>('/recruiter/jobs');
    return res.data;
  },

  getJobById: async (jobId: string): Promise<RecruiterJob> => {
    const res = await apiClient.get<RecruiterJob>(`/recruiter/jobs/${jobId}`);
    return res.data;
  },

  createJob: async (jobData: Partial<RecruiterJob>): Promise<RecruiterJob> => {
    const res = await apiClient.post<RecruiterJob>('/recruiter/jobs', jobData);
    return res.data;
  },

  publishJob: async (jobId: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/jobs/${jobId}/publish`);
    return res.data;
  },

  pauseJob: async (jobId: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/jobs/${jobId}/pause`);
    return res.data;
  },

  closeJob: async (jobId: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/jobs/${jobId}/close`);
    return res.data;
  },

  getCandidates: async (): Promise<RecruiterCandidateItem[]> => {
    const res = await apiClient.get<RecruiterCandidateItem[]>('/recruiter/candidates');
    return res.data;
  },

  saveCandidate: async (candidateId: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/recruiter/candidates/${candidateId}/save`, { candidate_id: candidateId });
    return res.data;
  },

  getJobMatches: async (jobId: string, candidateId?: string): Promise<any> => {
    const res = await apiClient.get(`/recruiter/jobs/${jobId}/matches`, { params: { candidateId } });
    return res.data;
  },

  getPipeline: async (jobId: string): Promise<CandidatePipelineItem[]> => {
    const res = await apiClient.get<CandidatePipelineItem[]>(`/recruiter/pipeline/${jobId}`);
    return res.data;
  },

  updatePipelineStage: async (pipelineId: string, stage: string, notes?: string): Promise<{ message: string }> => {
    const res = await apiClient.put(`/recruiter/pipeline/${pipelineId}`, { stage, notes });
    return res.data;
  },

  getInterviews: async (): Promise<InterviewItem[]> => {
    const res = await apiClient.get<InterviewItem[]>('/recruiter/interviews');
    return res.data;
  },

  scheduleInterview: async (payload: any): Promise<InterviewItem> => {
    const res = await apiClient.post<InterviewItem>('/recruiter/interviews', payload);
    return res.data;
  },

  submitInterviewFeedback: async (payload: any): Promise<any> => {
    const res = await apiClient.post(`/recruiter/interviews/${payload.interview_id}/feedback`, payload);
    return res.data;
  },

  createJobOffer: async (payload: any): Promise<any> => {
    const res = await apiClient.post('/recruiter/offers', payload);
    return res.data;
  },

  getMessageTemplates: async (): Promise<any[]> => {
    const res = await apiClient.get('/recruiter/templates');
    return res.data;
  },

  getTeamMembers: async (): Promise<any[]> => {
    const res = await apiClient.get('/recruiter/team');
    return res.data;
  },

  getAnalytics: async (): Promise<RecruiterAnalytics> => {
    const res = await apiClient.get<RecruiterAnalytics>('/recruiter/analytics');
    return res.data;
  },
};
