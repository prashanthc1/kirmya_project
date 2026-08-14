export interface IngestEventRequest {
  event_type: string;
  event_version?: string;
  user_id?: string;
  organization_id?: string;
  entity_type?: string;
  entity_id?: string;
  session_id?: string;
  source?: string;
  platform?: string;
  metadata?: Record<string, any>;
  idempotency_key?: string;
}

export interface UserPersonalAnalytics {
  profile_views_count: number;
  search_appearances_count: number;
  applications_count: number;
  applications_this_week: number;
  applications_this_month: number;
  saved_jobs_count: number;
  interview_invitation_rate: number;
  offer_rate: number;
  profile_completeness: number;
}

export interface FunnelStageItem {
  stage: string;
  count: number;
  percentage: number;
}

export interface RecruiterHiringAnalytics {
  jobs_posted_count: number;
  applications_count: number;
  candidates_viewed_count: number;
  interviews_count: number;
  offers_count: number;
  hires_count: number;
  avg_time_to_review_hours: number;
  application_funnel: FunnelStageItem[];
}

export interface CompanyOverviewAnalytics {
  company_profile_views_count: number;
  active_jobs_count: number;
  total_job_views_count: number;
  total_applications_count: number;
  followers_count: number;
  candidate_conversion_rate: number;
}

export interface CohortItem {
  cohort_date: string;
  period_offset: number;
  user_count: number;
  retained_count: number;
  retention_rate: number;
}

export interface AdminAnalyticsOverview {
  total_users: number;
  active_users_dau: number;
  active_users_mau: number;
  new_users_today: number;
  verified_users: number;
  total_jobs: number;
  total_applications: number;
  total_connections: number;
  total_messages: number;
  total_ai_requests: number;
  total_safety_reports: number;
  event_processing_latency_ms: number;
  data_freshness_timestamp: string;
}

export interface AnalyticsExportJob {
  id: string;
  admin_id: string;
  export_format: string;
  status: string;
  download_url?: string;
  expires_at: string;
  file_size_bytes?: number;
  created_at: string;
}


// Legacy Type Exports for Backward Compatibility
export type AdminAnalytics = AdminAnalyticsOverview;
export type RecruiterAnalytics = RecruiterHiringAnalytics;
export type UserAnalytics = UserPersonalAnalytics;

export interface TrackEventPayload {
  event_name: string;
  entity_id?: string;
  properties?: Record<string, any>;
}
