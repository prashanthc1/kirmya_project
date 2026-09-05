import axios from 'axios';
import { JobDetail, JobListPage, JobSearchParams, JobSummary } from './types';
import { authApiClient } from '../../services/authService';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const publicApiClient = axios.create({
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
    const res = await publicApiClient.get<JobListPage>('/jobs', { params: cleaned });
    return res.data;
  },

  /**
   * Fetch single job details by ID.
   */
  getJobById: async (id: string): Promise<JobDetail> => {
    const res = await publicApiClient.get<JobDetail>(`/jobs/${encodeURIComponent(id)}`);
    return res.data;
  },

  /**
   * Check if job is saved by current candidate.
   */
  isJobSaved: async (id: string): Promise<boolean> => {
    try {
      const res = await authApiClient.get<{ is_saved: boolean }>(`/jobs/${encodeURIComponent(id)}/saved-state`);
      return Boolean(res.data?.is_saved);
    } catch {
      return false;
    }
  },

  /**
   * Get candidate saved jobs list.
   */
  getSavedJobs: async (): Promise<JobSummary[]> => {
    const res = await authApiClient.get<{ data: JobSummary[] } | JobSummary[]>('/jobs/saved');
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return (res.data as { data: JobSummary[] }).data || [];
  },

  /**
   * Save / bookmark a job posting.
   */
  saveJob: async (id: string, notes?: string): Promise<void> => {
    await authApiClient.post(`/jobs/${encodeURIComponent(id)}/save`, { notes });
  },

  /**
   * Remove a saved job bookmark.
   */
  unsaveJob: async (id: string): Promise<void> => {
    await authApiClient.delete(`/jobs/${encodeURIComponent(id)}/save`);
  },

  /**
   * Submit job application.
   */
  applyToJob: async (id: string, payload?: Record<string, unknown>): Promise<{ message: string; applicationId?: string }> => {
    const res = await authApiClient.post(`/jobs/${encodeURIComponent(id)}/apply`, payload || {});
    return res.data;
  },
};
