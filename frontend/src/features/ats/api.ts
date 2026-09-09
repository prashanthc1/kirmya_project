import { authApiClient } from '../../services/authService';
import {
  JobApplicationDTO,
  InterviewFeedbackDTO,
  JobOfferDTO,
  AIEvaluationResponse,
} from './types';

/*
 * The shared authenticated client, not a bare axios instance.
 *
 * This module created its own client with `withCredentials: true` and
 * nothing else. The access token lives in memory in authService and is
 * attached by that client's request interceptor, so every call made here
 * went out unauthenticated and came back 401 - to a signed-in recruiter,
 * on every screen in the module.
 *
 * Nobody noticed because the fabricating catch blocks caught the 401 and
 * returned invented people in its place, so the screens looked like they
 * worked. Removing those fallbacks is what surfaced this: the module had
 * never once read the caller's own data.
 */
const apiClient = authApiClient;

export const atsApi = {
  getApplications: async (params?: { jobId?: string; stage?: string }): Promise<JobApplicationDTO[]> => {
    const res = await apiClient.get<JobApplicationDTO[]>('/recruiter/applications', { params });
    return res.data;
  },

  getApplicationDetail: async (id: string): Promise<JobApplicationDTO> => {
    const res = await apiClient.get<JobApplicationDTO>(`/recruiter/applications/${id}`);
    return res.data;
  },

  updateApplicationStage: async (id: string, stage: string, notes?: string): Promise<{ message: string }> => {
    const res = await apiClient.put(`/recruiter/applications/${id}/stage`, { stage, notes });
    return res.data;
  },

  bulkActionApplications: async (payload: { application_ids: string[]; action: string; target_stage?: string; notes?: string }): Promise<{ message: string }> => {
    const res = await apiClient.post('/recruiter/applications/bulk', payload);
    return res.data;
  },

  submitInterviewFeedback: async (payload: { interview_id: string; application_id: string; overall_rating: number; technical_score: number; communication_score: number; experience_score: number; culture_fit_score: number; recommendation: string; notes?: string }): Promise<InterviewFeedbackDTO> => {
    const res = await apiClient.post<InterviewFeedbackDTO>(`/recruiter/interviews/${payload.interview_id}/feedback`, payload);
    return res.data;
  },

  createJobOffer: async (payload: { application_id: string; job_id: string; candidate_id: string; position_title: string; salary: string; currency?: string; benefits?: string; joining_date?: string; contract_type?: string }): Promise<JobOfferDTO> => {
    const res = await apiClient.post<JobOfferDTO>('/recruiter/offers', payload);
    return res.data;
  },

  updateOfferStatus: async (id: string, status: string): Promise<{ message: string }> => {
    const res = await apiClient.put(`/recruiter/offers/${id}`, { status });
    return res.data;
  },

  getAIEvaluation: async (id: string): Promise<AIEvaluationResponse> => {
    const res = await apiClient.get<AIEvaluationResponse>(`/recruiter/applications/${id}/ai-eval`);
    return res.data;
  },
};
