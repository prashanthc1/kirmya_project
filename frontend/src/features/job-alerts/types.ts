export interface JobAlert {
  id: string;
  candidate_id: string;
  title: string;
  keywords: string;
  job_titles: string[];
  skills: string[];
  location: string;
  industry: string;
  departments: string[];
  salary_min: number;
  salary_max: number;
  employment_type: string;
  experience_level: string;
  country: string;
  city: string;
  remote_preference: string;
  company_size: string;
  company_type: string;
  visa_sponsorship: boolean;
  work_authorization: string;
  education_level: string;
  languages: string[];
  exclude_keywords: string;
  frequency: 'Immediately' | 'Every Hour' | 'Daily' | 'Weekly' | 'Custom';
  custom_schedule: string;
  channel_email: boolean;
  channel_push: boolean;
  channel_in_app: boolean;
  channel_sms: boolean;
  channel_webhook: boolean;
  is_active: boolean;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query_text: string;
  filters: Record<string, unknown>;
  auto_alert: boolean;
  alert_id?: string;
  created_at: string;
  updated_at: string;
}

export interface JobMatchScore {
  overall_score: number;
  skills_match: number;
  experience_match: number;
  education_match: number;
  salary_match: number;
  location_match: number;
  industry_match: number;
  growth_score: number;
  company_fit_score: number;
  confidence_score: number;
  match_reasons: string[];
  matching_skills: string[];
  missing_skills: string[];
}

export interface JobRecommendation {
  id: string;
  job_id: string;
  title: string;
  company_name: string;
  company_logo: string;
  company_verified: boolean;
  location: string;
  salary_range: string;
  salary_comparison: string;
  employment_type: string;
  remote_compatibility: string;
  experience_required: string;
  application_deadline: string;
  recruiter_activity: string;
  application_difficulty: string;
  section_tag: string;
  score: JobMatchScore;
  is_saved: boolean;
  is_applied: boolean;
  created_at: string;
}

export interface RecommendationFeedbackRequest {
  job_id: string;
  recommendation_id?: string;
  action_type:
    | 'interested'
    | 'not_interested'
    | 'hide_company'
    | 'hide_role'
    | 'already_applied'
    | 'too_senior'
    | 'too_junior'
    | 'wrong_location'
    | 'wrong_salary';
  feedback_reason?: string;
}

export interface AlertDeliveryHistory {
  id: string;
  alert_id: string;
  candidate_id: string;
  alert_title: string;
  delivery_channel: string;
  jobs_included: number;
  jobs_opened: number;
  jobs_clicked: number;
  applications_submitted: number;
  delivery_status: string;
  sent_at: string;
}

export interface CareerInsights {
  hiring_trends: Array<{ name: string; count: number }>;
  most_demanded_skills: Array<{ name: string; count: number }>;
  emerging_roles: Array<{ name: string; count: number }>;
  salary_trends: Array<{ role: string; avg_salary: number; growth_pct: number }>;
  industry_growth: Array<{ name: string; count: number }>;
  location_demand: Array<{ name: string; count: number }>;
  career_progress_suggestions: string[];
  missing_skills: string[];
  recommended_certifications: string[];
  recommended_learning_paths: string[];
  recommended_communities: string[];
  recommended_connections: string[];
}
