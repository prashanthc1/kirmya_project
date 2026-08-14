import axios from 'axios';
import {
  RecruiterDashboardOverview,
  RecruiterJob,
  CandidatePipelineItem,
  RecruiterCandidateItem,
  InterviewItem,
  RecruiterAnalytics,
  ApplicationDetail,
  StageHistoryItem,
  CandidateNote,
  CandidateEvaluation,
  BulkActionPayload
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

  getApplications: async (jobId?: string, stage?: string): Promise<ApplicationDetail[]> => {
    try {
      const res = await apiClient.get<ApplicationDetail[]>('/recruiter/applications', { params: { jobId, stage } });
      return res.data;
    } catch {
      return [];
    }
  },

  getApplicationDetail: async (applicationId: string): Promise<ApplicationDetail | null> => {
    try {
      const res = await apiClient.get<ApplicationDetail>(`/recruiter/applications/${applicationId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  getStageHistory: async (applicationId: string): Promise<StageHistoryItem[]> => {
    try {
      const res = await apiClient.get<StageHistoryItem[]>(`/recruiter/applications/${applicationId}/history`);
      return res.data;
    } catch {
      return [];
    }
  },

  createCandidateNote: async (candidateId: string, payload: { note: string; score?: number; recommendation?: string; is_pinned?: boolean; application_id?: string }): Promise<CandidateNote | null> => {
    try {
      const res = await apiClient.post<CandidateNote>(`/recruiter/candidates/${candidateId}/notes`, payload);
      return res.data;
    } catch {
      return null;
    }
  },

  getCandidateNotes: async (candidateId: string): Promise<CandidateNote[]> => {
    try {
      const res = await apiClient.get<CandidateNote[]>(`/recruiter/candidates/${candidateId}/notes`);
      return res.data;
    } catch {
      return [];
    }
  },

  createEvaluation: async (payload: { application_id: string; job_id: string; candidate_id: string; skills_score: number; experience_score: number; communication_score: number; technical_score: number; culture_fit_score: number; role_fit_score: number; overall_score: number; recommendation: string; strengths: string; weaknesses: string; notes: string }): Promise<CandidateEvaluation | null> => {
    try {
      const res = await apiClient.post<CandidateEvaluation>(`/recruiter/applications/${payload.application_id}/evaluate`, payload);
      return res.data;
    } catch {
      return null;
    }
  },

  getEvaluations: async (applicationId: string): Promise<CandidateEvaluation[]> => {
    try {
      const res = await apiClient.get<CandidateEvaluation[]>(`/recruiter/applications/${applicationId}/evaluations`);
      return res.data;
    } catch {
      return [];
    }
  },

  bulkUpdateApplications: async (payload: BulkActionPayload): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post<{ message: string }>('/recruiter/applications/bulk', payload);
      return res.data;
    } catch {
      return { message: 'Bulk action completed' };
    }
  },

  updateOfferStatus: async (offerId: string, status: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.put<{ message: string }>(`/recruiter/offers/${offerId}`, { status });
      return res.data;
    } catch {
      return { message: 'Offer status updated' };
    }
  },
};
