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
