export type ApplicationStage =
  | 'Applied'
  | 'Viewed'
  | 'Shortlisted'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export interface ApplicationSummary {
  id: string;
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
  company_logo: string;
  location: string;
  employment_type: string;
  salary_range: string;
  current_status: ApplicationStage;
  status_explanation?: string;
  applied_at: string;
  last_update: string;
  recruiter_id?: string;
  recruiter_name?: string;
  recruiter_avatar?: string;
  recruiter_email?: string;
  next_interview_date?: string;
  is_saved: boolean;
  notes_count: number;
}

export interface ApplicationTimelineItem {
  id: string;
  status: string;
  title: string;
  description: string;
  date: string;
  moved_by: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  candidate_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateDocument {
  id: string;
  candidate_id: string;
  title: string;
  document_type: string;
  file_url: string;
  size_bytes: number;
  file_type: string;
  is_default: boolean;
  uploaded_at: string;
}

export interface CandidateInterview {
  id: string;
  application_id: string;
  job_title: string;
  company_name: string;
  company_logo: string;
  title: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  location_type: string;
  meeting_link: string;
  notes: string;
  interviewer: string;
}

export interface JobOfferDTO {
  id: string;
  application_id: string;
  position_title: string;
  salary: string;
  currency: string;
  benefits: string;
  joining_date?: string;
  contract_type: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

export interface ApplicationDetail {
  summary: ApplicationSummary;
  job_description: string;
  requirements: string[];
  skills: string[];
  timeline: ApplicationTimelineItem[];
  submitted_resume?: CandidateDocument;
  submitted_cover_letter?: CandidateDocument;
  notes: ApplicationNote[];
  interviews: CandidateInterview[];
  offer?: JobOfferDTO;
}

export interface SavedJobDTO {
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
}

export interface JobAlertDTO {
  id: string;
  candidate_id: string;
  title: string;
  keywords: string;
  job_titles: string[];
  skills: string[];
  location: string;
  industry: string;
  salary_min: number;
  salary_max: number;
  employment_type: string;
  frequency: string;
  channel_email: boolean;
  channel_push: boolean;
  channel_in_app: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateJobAlertPayload {
  title: string;
  keywords: string;
  job_titles: string[];
  skills: string[];
  location: string;
  industry: string;
  salary_min: number;
  salary_max: number;
  employment_type: string;
  frequency: string;
  channel_email: boolean;
  channel_push: boolean;
  channel_in_app: boolean;
}

export interface ApplicationStatsDTO {
  total_applications: number;
  active_applications: number;
  interviews_scheduled: number;
  offers_received: number;
  rejected_applications: number;
  response_rate: number;
}

export interface AIApplicationInsightsDTO {
  /** False when there are too few applications for a rate to mean anything. */
  sufficient: boolean;
  /** The threshold `sufficient` is measured against. */
  minimum_applications: number;
  /** How many applications the rates are computed over. */
  applications_considered: number;
  /** Share of applications that drew any reply, including a rejection. */
  response_rate: number;
  /** Share that reached interview or beyond. */
  interview_rate: number;
  /** Share that reached an offer. */
  offer_rate: number;
  /** Standing advice, identical for every candidate. */
  general_guidance: string[];
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface MonthlyCountDTO {
  month: string;
  count: number;
}

export interface FunnelStageDTO {
  stage: string;
  count: number;
}

export interface CareerAnalyticsDTO {
  applications_sent: number;
  interview_rate: number;
  response_rate: number;
  time_to_response_days: number;
  most_applied_roles: CategoryCount[];
  most_applied_companies: CategoryCount[];
  application_trend: MonthlyCountDTO[];
  status_funnel: FunnelStageDTO[];
}
