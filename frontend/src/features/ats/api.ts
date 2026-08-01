import axios from 'axios';
import {
  JobApplicationDTO,
  InterviewFeedbackDTO,
  JobOfferDTO,
  AIEvaluationResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

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
