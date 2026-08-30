import axios from 'axios';
import { JobDetail, JobListPage, JobSearchParams, JobSummary } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const jobsApi = {
  /**
   * Public, platform-wide job board search.
   */
  search: async (params?: JobSearchParams): Promise<JobListPage> => {
    const cleaned = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== '' && v !== null),
    );
    const res = await apiClient.get<JobListPage>('/jobs', { params: cleaned });
    return res.data;
  },

  /**
   * Fetch single job details by ID.
   */
  getJobById: async (id: string): Promise<JobDetail> => {
    const res = await apiClient.get<JobDetail>(`/jobs/${encodeURIComponent(id)}`);
    return res.data;
  },

  /**
   * Get candidate saved jobs list.
   */
  getSavedJobs: async (): Promise<JobSummary[]> => {
    const res = await apiClient.get<{ data: JobSummary[] } | JobSummary[]>('/jobs/saved');
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return (res.data as { data: JobSummary[] }).data || [];
  },

  /**
   * Save / bookmark a job posting.
   */
  saveJob: async (id: string): Promise<void> => {
    await apiClient.post(`/jobs/${encodeURIComponent(id)}/save`);
  },

  /**
   * Remove a saved job bookmark.
   */
  unsaveJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${encodeURIComponent(id)}/save`);
  },

  /**
   * Submit job application.
   */
  applyToJob: async (id: string, payload?: Record<string, unknown>): Promise<{ message: string; applicationId?: string }> => {
    const res = await apiClient.post(`/jobs/${encodeURIComponent(id)}/apply`, payload || {});
    return res.data;
  },
};
