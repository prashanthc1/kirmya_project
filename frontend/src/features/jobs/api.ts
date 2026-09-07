import axios from 'axios';
import { JobDetail, JobListPage, JobSearchParams, JobSummary, SavedJobSummary } from './types';
import { authApiClient } from '../../services/authService';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const publicApiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});


/** The saved_jobs row as the API returns it. */
interface SavedJobRow {
  id: string;
  candidate_id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  company_logo: string;
  location: string;
  salary_range: string;
  employment_type: string;
  collection_id?: string;
  collection_name?: string;
  notes: string;
  saved_at: string;
  is_active: boolean;
}

/**
 * Maps a saved_jobs row onto the job it refers to.
 *
 * The mapping is explicit because the two identifiers are easy to confuse and
 * the consequences are silent: `row.id` is the bookmark and `row.job_id` is the
 * posting, so passing the row through unmapped produced links to
 * /jobs/<bookmark-id> and a remove call that deleted nothing. `job_title` is
 * likewise not `title`, so an unmapped row rendered a card with no name.
 */
function toSavedJobSummary(row: SavedJobRow): SavedJobSummary {
  return {
    id: row.job_id,
    saved_job_id: row.id,
    title: row.job_title,
    company_name: row.company_name,
    company_logo: row.company_logo,
    location: row.location,
    salary_range: row.salary_range,
    employment_type: row.employment_type,
    skills: [],
    is_featured: false,
    saved_notes: row.notes,
    saved_at: row.saved_at,
    is_active: row.is_active,
    // The saved_jobs row carries when it was bookmarked, not when the posting
    // was created; the bookmark time is the only honest value available here.
    created_at: row.saved_at,
  };
}

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
  getSavedJobs: async (): Promise<SavedJobSummary[]> => {
    const res = await authApiClient.get<{ data: SavedJobRow[] } | SavedJobRow[]>('/jobs/saved');
    const rows = Array.isArray(res.data)
      ? res.data
      : (res.data as { data: SavedJobRow[] }).data || [];
    return rows.map(toSavedJobSummary);
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
