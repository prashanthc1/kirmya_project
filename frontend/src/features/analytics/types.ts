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


export interface SystemPerformanceAnalytics {
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  api_request_rate_rps: number;
  db_latency_ms: number;
  redis_latency_ms: number;
  search_latency_ms: number;
  otel_exporter_status: 'healthy' | 'degraded' | 'error' | string;
  active_worker_threads: number;
  error_rate_pct: number;
}

export interface TrustSafetyAnalytics {
  total_reports_count: number;
  resolved_reports_count: number;
  avg_resolution_time_mins: number;
  user_restrictions_count: number;
  permanent_bans_count: number;
  security_threat_level: 'low' | 'medium' | 'high' | 'critical' | string;
  flagged_content_count: number;
  spam_score_avg: number;
}

export interface MentorshipAnalytics {
  total_mentors_count: number;
  active_pairings_count: number;
  completed_sessions_count: number;
  avg_rating: number;
  top_skills_mentored: Array<{ skill: string; session_count: number }>;
}

export interface LearningAnalytics {
  courses_enrolled_count: number;
  courses_completed_count: number;
  total_learning_hours: number;
  certificates_issued_count: number;
  skill_assessments_passed: number;
}

export interface CohortGridAnalytics {
  cohorts: Array<{
    cohort_name: string;
    cohort_date: string;
    initial_users: number;
    retention_percentages: number[];
  }>;
}

export interface UserActivationFunnel {
  stages: Array<{
    stage_name: string;
    count: number;
    conversion_pct: number;
    dropoff_pct: number;
  }>;
}

export interface FeatureAdoptionMetrics {
  feature_name: string;
  active_users_count: number;
  adoption_rate_pct: number;
  daily_usage_count: number;
}

export interface UserConsentPreferences {
  essential_telemetry: boolean;
  optional_analytics: boolean;
  personalization_tracking: boolean;
  data_retention_period_days: number;
  updated_at: string;
}

export interface CustomReportRequest {
  title: string;
  report_type: string;
  date_from?: string;
  date_to?: string;
  metrics?: string[];
  export_format: 'csv' | 'json' | 'pdf';
  recipients?: string[];
  cron_expression?: string;
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

