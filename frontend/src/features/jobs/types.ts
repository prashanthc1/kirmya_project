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
