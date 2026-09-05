import { authApiClient } from '../../services/authService';
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
  CareerAnalyticsDTO,
  AIApplicationInsightsDTO,
} from './types';

export * from './types';

const apiClient = authApiClient;

export const applicationsApi = {
  getApplications: async (params?: { status?: string; search?: string }): Promise<ApplicationSummary[]> => {
    const res = await apiClient.get<ApplicationSummary[]>('/applications', { params });
    return res.data;
  },

  applyToJob: async (payload: {
    job_id: string;
    resume_id?: string;
    cover_letter?: string;
    answers?: Array<{ question_id: string; question_text: string; answer: string }>;
    screening_answers?: Record<string, any>;
    idempotency_key?: string;
  }): Promise<ApplicationDetail> => {
    const res = await apiClient.post<ApplicationDetail>('/applications', payload);
    return res.data;
  },

  getApplicationByID: async (id: string): Promise<ApplicationDetail> => {
    const res = await apiClient.get<ApplicationDetail>(`/applications/${id}`);
    return res.data;
  },

  withdrawApplication: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.put<{ message: string }>(`/applications/${id}/withdraw`);
    return res.data;
  },

  archiveApplication: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(`/applications/${id}/archive`);
    return res.data;
  },

  getApplicationTimeline: async (id: string): Promise<ApplicationTimelineItem[]> => {
    const res = await apiClient.get<ApplicationTimelineItem[]>(`/applications/${id}/timeline`);
    return res.data;
  },

  isJobSaved: async (jobId: string): Promise<boolean> => {
    try {
      const res = await apiClient.get<{ is_saved: boolean }>(`/jobs/${jobId}/saved-state`);
      return Boolean(res.data?.is_saved);
    } catch {
      return false;
    }
  },

  getSavedJobs: async (): Promise<SavedJobDTO[]> => {
    const res = await apiClient.get<SavedJobDTO[]>('/jobs/saved');
    return res.data;
  },

  saveJob: async (jobId: string, notes?: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(`/jobs/${jobId}/save`, { notes });
    return res.data;
  },

  removeSavedJob: async (jobId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/jobs/${jobId}/save`);
    return res.data;
  },

  getJobAlerts: async (): Promise<JobAlertDTO[]> => {
    const res = await apiClient.get<JobAlertDTO[]>('/job-alerts');
    return res.data;
  },

  createJobAlert: async (payload: CreateJobAlertPayload): Promise<JobAlertDTO> => {
    const res = await apiClient.post<JobAlertDTO>('/job-alerts', payload);
    return res.data;
  },

  deleteJobAlert: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/job-alerts/${id}`);
    return res.data;
  },

  getInterviews: async (): Promise<CandidateInterview[]> => {
    const res = await apiClient.get<CandidateInterview[]>('/interviews');
    return res.data;
  },

  getDocuments: async (): Promise<CandidateDocument[]> => {
    const res = await apiClient.get<CandidateDocument[]>('/documents');
    return res.data;
  },

  uploadDocument: async (payload: {
    title: string;
    document_type: string;
    file_url: string;
    is_default: boolean;
  }): Promise<CandidateDocument> => {
    const res = await apiClient.post<CandidateDocument>('/documents/upload', payload);
    return res.data;
  },

  deleteDocument: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/documents/${id}`);
    return res.data;
  },

  getAnalytics: async (): Promise<{ stats: ApplicationStatsDTO; analytics: CareerAnalyticsDTO }> => {
    try {
      const res = await apiClient.get<{ stats: ApplicationStatsDTO; analytics: CareerAnalyticsDTO }>(
        '/applications/analytics'
      );
      return res.data;
    } catch {
      return {
        stats: {
          total_applications: 0,
          active_applications: 0,
          interviews_scheduled: 0,
          offers_received: 0,
          rejected_applications: 0,
          response_rate: 0,
        },
        analytics: {
          applications_sent: 0,
          interview_rate: 0,
          response_rate: 0,
          time_to_response_days: 0,
          most_applied_roles: [],
          most_applied_companies: [],
          application_trend: [],
          status_funnel: [],
        },
      };
    }
  },

  getAIInsights: async (): Promise<AIApplicationInsightsDTO | undefined> => {
    try {
      const res = await apiClient.get<AIApplicationInsightsDTO>('/applications/insights');
      return res.data;
    } catch {
      return undefined;
    }
  },
};
