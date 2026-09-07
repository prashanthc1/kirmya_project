export interface JobSummary {
  id: string;
  title: string;
  company_id?: string;
  company_name?: string;
  company_handle?: string;
  company_logo?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  experience_level?: string;
  department?: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  skills: string[];
  is_featured: boolean;
  published_at?: string;
  created_at: string;
}

export interface JobDetail extends JobSummary {
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  status?: string;
  expires_at?: string;
  screening_questions?: Array<{
    id: string;
    question: string;
    required?: boolean;
  }>;
}

export interface JobListPage {
  data: JobSummary[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface JobSearchParams {
  q?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  experience_level?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SavedJobItem {
  id: string;
  job_id: string;
  candidate_id: string;
  notes?: string;
  saved_at: string;
  job?: JobSummary;
}

/**
 * A saved job as the saved-jobs list needs it.
 *
 * `GET /api/v1/jobs/saved` returns saved_jobs rows, whose `id` is the bookmark
 * and whose `job_id` is the posting. Treating that response as a JobSummary
 * meant `id` was the bookmark: the card linked to /jobs/<bookmark-id>, the
 * remove button issued DELETE /jobs/<bookmark-id>/save and deleted nothing, and
 * `title` was undefined because the row calls it `job_title`.
 *
 * The two identifiers are kept separate and named, so neither can be used where
 * the other belongs.
 */
export interface SavedJobSummary extends JobSummary {
  /** saved_jobs row id — identifies the bookmark, never the posting. */
  saved_job_id: string;
  /** Free-text note the candidate attached to the bookmark. */
  saved_notes?: string;
  saved_at?: string;
  /** False once the underlying posting is no longer open. */
  is_active?: boolean;
}
