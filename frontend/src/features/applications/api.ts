import axios from 'axios';
import {
  ApplicationSummary,
  ApplicationDetail,
  ApplicationTimelineItem,
  SavedJobDTO,
  JobAlertDTO,
  CreateJobAlertPayload,
  CandidateInterview,
  CandidateDocument,
  ApplicationStatsDTO,
  AIApplicationInsightsDTO,
  CareerAnalyticsDTO,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const applicationsApi = {
  getApplications: async (params?: { status?: string; search?: string }) => {
    const res = await axios.get<ApplicationSummary[]>(`${API_BASE}/applications`, { params });
    return res.data;
  },

  applyToJob: async (payload: { job_id: string; resume_id?: string; cover_letter?: string }) => {
    const res = await axios.post<ApplicationDetail>(`${API_BASE}/applications`, payload);
    return res.data;
  },

  getApplicationByID: async (id: string) => {
    const res = await axios.get<ApplicationDetail>(`${API_BASE}/applications/${id}`);
    return res.data;
  },

  withdrawApplication: async (id: string) => {
    const res = await axios.put(`${API_BASE}/applications/${id}/withdraw`);
    return res.data;
  },

  getApplicationTimeline: async (id: string) => {
    const res = await axios.get<ApplicationTimelineItem[]>(`${API_BASE}/applications/${id}/timeline`);
    return res.data;
  },

  getSavedJobs: async () => {
    const res = await axios.get<SavedJobDTO[]>(`${API_BASE}/jobs/saved`);
    return res.data;
  },

  saveJob: async (jobId: string, notes?: string) => {
    const res = await axios.post(`${API_BASE}/jobs/${jobId}/save`, { notes });
    return res.data;
  },

  removeSavedJob: async (jobId: string) => {
    const res = await axios.delete(`${API_BASE}/jobs/${jobId}/save`);
    return res.data;
  },

  getJobAlerts: async () => {
    const res = await axios.get<JobAlertDTO[]>(`${API_BASE}/job-alerts`);
    return res.data;
  },

  createJobAlert: async (payload: CreateJobAlertPayload) => {
    const res = await axios.post<JobAlertDTO>(`${API_BASE}/job-alerts`, payload);
    return res.data;
  },

  deleteJobAlert: async (id: string) => {
    const res = await axios.delete(`${API_BASE}/job-alerts/${id}`);
    return res.data;
  },

  getInterviews: async () => {
    const res = await axios.get<CandidateInterview[]>(`${API_BASE}/interviews`);
    return res.data;
  },

  getDocuments: async () => {
    const res = await axios.get<CandidateDocument[]>(`${API_BASE}/documents`);
    return res.data;
  },

  uploadDocument: async (payload: { title: string; document_type: string; file_url: string; is_default: boolean }) => {
    const res = await axios.post<CandidateDocument>(`${API_BASE}/documents/upload`, payload);
    return res.data;
  },

  deleteDocument: async (id: string) => {
    const res = await axios.delete(`${API_BASE}/documents/${id}`);
    return res.data;
  },

  getAnalytics: async () => {
    const res = await axios.get<{ stats: ApplicationStatsDTO; analytics: CareerAnalyticsDTO }>(
      `${API_BASE}/applications/analytics`
    );
    return res.data;
  },

  getAIInsights: async () => {
    const res = await axios.get<AIApplicationInsightsDTO>(`${API_BASE}/applications/ai-insights`);
    return res.data;
  },
};
