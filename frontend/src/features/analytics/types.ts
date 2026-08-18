/**
 * TypeScript mirror of the Go analytics DTOs.
 *
 * Every field name here is the exact `json:` tag from
 * `backend/internal/analytics/models/{analytics,filters,events}.go`. Nothing is
 * renamed to camelCase: a rename would be a silent contract break that only
 * shows up as `undefined` at runtime, so the wire names are kept verbatim —
 * including the `_pct` suffix the backend uses for percentages.
 *
 * Optional (`?`) marks a Go tag carrying `omitempty`, which is genuinely absent
 * from the payload rather than null.
 */

// ---------------------------------------------------------------------------
// Bounded vocabularies
//
// These are unions rather than `string` so a dashboard cannot construct a
// filter the backend's validator will reject at request time.
// ---------------------------------------------------------------------------

/** models.DateRangePreset */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'previous_month'
  | 'custom';

/** models.Granularity */
export type Granularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

/** models.FreshnessKind */
export type FreshnessKind = 'real_time' | 'near_real_time' | 'daily_aggregate';

/** models.EventCategory — the `category` filter vocabulary. */
export type EventCategory =
  | 'user'
  | 'job'
  | 'application'
  | 'networking'
  | 'messaging'
  | 'community'
  | 'mentorship'
  | 'learning'
  | 'search'
  | 'recommendation'
  | 'notification'
  | 'job_alert'
  | 'trust_safety';

/** models.reportTypes — the 13 generatable reports. */
export type ReportType =
  | 'platform_overview'
  | 'user_growth'
  | 'job_market'
  | 'applications'
  | 'networking'
  | 'communities'
  | 'mentorship'
  | 'learning'
  | 'search'
  | 'recommendations'
  | 'notifications'
  | 'trust_safety'
  | 'system_performance';

/** models.FormatCSV / FormatJSON. PDF is deliberately not offered. */
export type ExportFormat = 'csv' | 'json';

/** models.FrequencyDaily / Weekly / Monthly. */
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

/** models.ReportStatus* */
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** allowedFilterValues["platform"] */
export type PlatformFilter = 'desktop' | 'tablet' | 'mobile' | 'ios' | 'android' | 'server' | 'all';

/** allowedFilterValues["source"] */
export type SourceFilter = 'web' | 'mobile_web' | 'mobile_app' | 'api' | 'worker' | 'system' | 'all';

/** allowedFilterValues["user_type"] */
export type UserTypeFilter = 'candidate' | 'recruiter' | 'admin' | 'all';

/** allowedFilterValues["experience_level"] — capitalised exactly as the DB stores it. */
export type ExperienceLevelFilter = 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive' | 'all';

/** allowedFilterValues["employment_type"] */
export type EmploymentTypeFilter =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Internship'
  | 'Temporary'
  | 'all';

/** allowedFilterValues["work_mode"] */
export type WorkModeFilter = 'onsite' | 'hybrid' | 'remote' | 'all';

/**
 * models.FilterQuery — the analytics query string.
 *
 * These are the `form:` tags, not JSON: they travel as URL parameters. Any key
 * left undefined or blank is dropped before the request is sent, because the
 * backend validator rejects an empty value rather than ignoring it.
 */
export interface AnalyticsFilterParams {
  preset?: DateRangePreset;
  /** YYYY-MM-DD, required (with end_date) when preset is 'custom'. */
  start_date?: string;
  /** YYYY-MM-DD, inclusive to the caller. */
  end_date?: string;
  granularity?: Granularity;
  category?: EventCategory | 'all';
  /** A catalog event name, e.g. 'job.viewed'. */
  event_type?: string;
  platform?: PlatformFilter;
  source?: SourceFilter;
  user_type?: UserTypeFilter;
  experience_level?: ExperienceLevelFilter;
  employment_type?: EmploymentTypeFilter;
  work_mode?: WorkModeFilter;
  industry?: string;
  job_category?: string;
  /** ISO-3166 alpha-2. Nothing finer than a country is accepted. */
  country?: string;
  company_id?: string;
  community_id?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** models.DateRange — half-open [start, end). */
export interface DateRange {
  start: string;
  end: string;
  preset: DateRangePreset;
  granularity: Granularity;
}

/** models.Freshness — accompanies every metric response. */
export interface Freshness {
  kind: FreshnessKind;
  generated_at: string;
  /** Newest data point included; a stale rollup is visible here. */
  as_of: string;
  cached: boolean;
}

/** models.TimeSeriesPoint */
export interface TimeSeriesPoint {
  bucket: string;
  value: number;
  /** Withheld by k-anonymity; render as withheld, not as a real zero. */
  suppressed?: boolean;
}

/** models.TimeSeries */
export interface TimeSeries {
  metric: string;
  granularity: Granularity;
  points: TimeSeriesPoint[];
}

/** models.LabelledCount */
export interface LabelledCount {
  label: string;
  count: number;
  share_pct: number;
  suppressed?: boolean;
}

/** models.SkillDemandItem */
export interface SkillDemandItem {
  skill: string;
  count: number;
  share_pct: number;
}

/** models.FunnelStageItem */
export interface FunnelStageItem {
  stage: string;
  key?: string;
  count: number;
  suppressed?: boolean;
  /** Conversion from the first stage. */
  percentage: number;
  /** Share lost since the previous stage. */
  drop_off_rate: number;
}

/** models.FunnelResult */
export interface FunnelResult {
  name: string;
  label: string;
  range: DateRange;
  steps: FunnelStageItem[];
}

/** models.CohortItem — one cell of a retention matrix. */
export interface CohortItem {
  cohort_date: string;
  period_offset: number;
  cohort_size: number;
  retained_count: number;
  retention_rate: number;
  suppressed?: boolean;
}

/** models.RetentionBucket */
export interface RetentionBucket {
  day_offset: number;
  cohort_size: number;
  retained_count: number;
  retention_rate_pct: number;
  suppressed?: boolean;
}

// ---------------------------------------------------------------------------
// Event ingestion
// ---------------------------------------------------------------------------

/** models.IngestEventRequest */
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
  /** Free-form producer payload; never rendered back into a dashboard. */
  metadata?: Record<string, unknown>;
  idempotency_key?: string;
  occurred_at?: string;
}

/** models.IngestedEvent */
export interface IngestedEvent {
  id: string;
  event_type: string;
  event_version: string;
  user_id?: string;
  organization_id?: string;
  entity_type?: string;
  entity_id?: string;
  session_id?: string;
  source: string;
  platform: string;
  metadata?: Record<string, unknown>;
  idempotency_key?: string;
  created_at: string;
  /** True when the idempotency key already existed and the write was a no-op. */
  deduplicated: boolean;
}

/** The POST /analytics/events response envelope. */
export interface IngestEventResponse {
  message: string;
  event: IngestedEvent;
}

/** repository.EventSummary — one row of the admin event feed. Carries no metadata. */
export interface EventSummary {
  id: string;
  event_type: string;
  event_version: string;
  entity_type?: string;
  source: string;
  platform: string;
  /** Whether the event was attributed to a user, without identifying which. */
  has_user: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Personal analytics
// ---------------------------------------------------------------------------

/** models.UserPersonalAnalytics — only ever returned to its owner. */
export interface UserPersonalAnalytics {
  profile_views_count: number;
  search_appearances_count: number;
  applications_count: number;
  applications_this_week: number;
  applications_this_month: number;
  saved_jobs_count: number;
  interviews_count: number;
  offers_count: number;
  rejections_count: number;
  withdrawn_count: number;
  active_applications_count: number;
  response_rate_pct: number;
  interview_invitation_rate_pct: number;
  offer_rate_pct: number;
  profile_completeness_pct: number;
  connections_count: number;
  communities_count: number;
  courses_in_progress: number;
  courses_completed: number;
  freshness: Freshness;
}

/** models.PersonalActivityAnalytics */
export interface PersonalActivityAnalytics {
  applications: TimeSeries;
  saved_jobs: TimeSeries;
  freshness: Freshness;
}

// ---------------------------------------------------------------------------
// Employer analytics
// ---------------------------------------------------------------------------

/** models.JobPerformanceItem */
export interface JobPerformanceItem {
  job_id: string;
  title: string;
  status: string;
  views_count: number;
  saves_count: number;
  applications_count: number;
  /** Applications that advanced past initial screening. */
  qualified_count: number;
  interviews_count: number;
  offers_count: number;
  hires_count: number;
  conversion_rate_pct: number;
  published_at?: string;
}

/** models.RecruiterHiringAnalytics */
export interface RecruiterHiringAnalytics {
  company_id: string;
  jobs_posted_count: number;
  active_jobs_count: number;
  applications_count: number;
  candidates_viewed_count: number;
  screening_count: number;
  interviews_count: number;
  offers_count: number;
  hires_count: number;
  rejections_count: number;
  avg_time_to_review_hours: number;
  avg_time_to_hire_days: number;
  application_funnel: FunnelStageItem[];
  top_jobs: JobPerformanceItem[];
  freshness: Freshness;
}

/** models.CompanyOverviewAnalytics */
export interface CompanyOverviewAnalytics {
  company_id: string;
  company_profile_views_count: number;
  active_jobs_count: number;
  total_jobs_count: number;
  total_job_views_count: number;
  total_saves_count: number;
  total_applications_count: number;
  followers_count: number;
  candidate_conversion_rate_pct: number;
  freshness: Freshness;
}

// ---------------------------------------------------------------------------
// Platform analytics (admin only)
// ---------------------------------------------------------------------------

/** models.AdminAnalyticsOverview — the platform KPI header. */
export interface AdminAnalyticsOverview {
  total_users: number;
  new_users: number;
  verified_users: number;
  active_users_dau: number;
  active_users_wau: number;
  active_users_mau: number;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  total_connections: number;
  total_communities: number;
  total_messages: number;
  mentorship_sessions: number;
  learning_activity: number;
  search_count: number;
  notifications_sent: number;
  open_safety_reports: number;
  total_safety_reports: number;
  /** Raw events in the window — the signal that ingestion is alive. */
  events_ingested: number;
  failed_events: number;
  range: DateRange;
  freshness: Freshness;
}

/** models.UserGrowthAnalytics */
export interface UserGrowthAnalytics {
  total_registrations: number;
  new_registrations: number;
  verified_count: number;
  verification_rate_pct: number;
  profile_completed_rate_pct: number;
  deleted_accounts: number;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  returning_users: number;
  registration_series: TimeSeries;
  active_user_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.ProfileSectionCompletion — counts only, no profile content. */
export interface ProfileSectionCompletion {
  section: string;
  completed_count: number;
  total_count: number;
  completion_rate_pct: number;
  suppressed?: boolean;
}

/** models.ProfileCompletionAnalytics */
export interface ProfileCompletionAnalytics {
  sections: ProfileSectionCompletion[];
  avg_completion_rate_pct: number;
  freshness: Freshness;
}

/** models.EngagementAnalytics */
export interface EngagementAnalytics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  dau_over_mau_pct: number;
  total_sessions: number;
  returning_users: number;
  returning_rate_pct: number;
  active_user_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.FeatureAdoptionItem */
export interface FeatureAdoptionItem {
  feature: string;
  label: string;
  users_count: number;
  events_count: number;
  adoption_rate_pct: number;
  suppressed?: boolean;
}

/** models.FeatureAdoptionMetrics */
export interface FeatureAdoptionMetrics {
  eligible_users: number;
  features: FeatureAdoptionItem[];
  range: DateRange;
  freshness: Freshness;
}

/** models.JobMarketAnalytics */
export interface JobMarketAnalytics {
  total_jobs_created: number;
  jobs_published: number;
  active_jobs_count: number;
  expired_jobs_count: number;
  closed_jobs_count: number;
  draft_jobs_count: number;
  job_views: number;
  job_saves: number;
  applications: number;
  view_to_apply_rate_pct: number;
  jobs_by_industry: LabelledCount[];
  jobs_by_employment_type: LabelledCount[];
  jobs_by_work_mode: LabelledCount[];
  jobs_by_experience_level: LabelledCount[];
  top_skills_requested: SkillDemandItem[];
  creation_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.ApplicationAnalytics */
export interface ApplicationAnalytics {
  total_applications: number;
  withdrawals: number;
  screening: number;
  interviews: number;
  offers: number;
  rejections: number;
  hires: number;
  by_stage: LabelledCount[];
  funnel_stages: FunnelStageItem[];
  application_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.NetworkingAnalytics */
export interface NetworkingAnalytics {
  connection_requests: number;
  accepted_connections: number;
  rejected_connections: number;
  pending_connections: number;
  acceptance_rate_pct: number;
  total_connections: number;
  new_connections: number;
  referrals_requested: number;
  referrals_completed: number;
  messages_sent: number;
  active_conversations: number;
  connection_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.CommunityAnalytics */
export interface CommunityAnalytics {
  total_communities: number;
  new_communities: number;
  public_communities: number;
  total_memberships: number;
  new_memberships: number;
  active_communities: number;
  active_members_count: number;
  posts_count: number;
  moderation_reports: number;
  resolved_moderations: number;
  growth_rate_pct: number;
  communities_by_category: LabelledCount[];
  range: DateRange;
  freshness: Freshness;
}

/** models.MessagingMetadataAnalytics — volume only; no message content. */
export interface MessagingMetadataAnalytics {
  total_conversations: number;
  active_conversations: number;
  total_messages_sent: number;
  read_messages: number;
  read_rate_pct: number;
  message_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.MentorshipAnalytics */
export interface MentorshipAnalytics {
  total_requests: number;
  accepted_requests: number;
  declined_requests: number;
  acceptance_rate_pct: number;
  sessions_held: number;
  completed_count: number;
  completion_rate_pct: number;
  ratings_count: number;
  satisfaction_score: number;
  range: DateRange;
  freshness: Freshness;
}

/** models.LearningAnalytics */
export interface LearningAnalytics {
  resources_viewed: number;
  resources_completed: number;
  completion_rate_pct: number;
  courses_enrolled: number;
  courses_in_progress: number;
  skills_added: number;
  certificates_issued: number;
  active_learners_count: number;
  avg_time_spent_minutes: number;
  assessments_taken: number;
  avg_assessment_score: number;
  range: DateRange;
  freshness: Freshness;
}

/** models.SearchTermItem */
export interface SearchTermItem {
  query_term: string;
  search_count: number;
  unique_users: number;
  avg_results: number;
  click_rate_pct: number;
}

/** models.ZeroResultSearchItem — admin-only, aggregated, never tied to a user. */
export interface ZeroResultSearchItem {
  query_term: string;
  search_count: number;
  unique_users: number;
  last_searched: string;
}

/** models.SearchAnalytics */
export interface SearchAnalytics {
  total_searches: number;
  unique_searchers: number;
  zero_result_count: number;
  zero_result_rate_pct: number;
  click_through_rate_pct: number;
  avg_results_count: number;
  avg_latency_ms: number;
  searches_by_type: LabelledCount[];
  popular_terms: SearchTermItem[];
  zero_result_searches: ZeroResultSearchItem[];
  low_click_terms: SearchTermItem[];
  search_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.RecommendationAnalytics */
export interface RecommendationAnalytics {
  total_impressions: number;
  total_views: number;
  total_clicks: number;
  total_saves: number;
  total_applies: number;
  total_dismissals: number;
  click_through_rate_pct: number;
  save_rate_pct: number;
  apply_rate_pct: number;
  dismiss_rate_pct: number;
  avg_match_score: number;
  range: DateRange;
  freshness: Freshness;
}

/** models.JobAlertAnalytics */
export interface JobAlertAnalytics {
  alerts_created: number;
  active_alerts: number;
  alerts_triggered: number;
  alerts_delivered: number;
  alerts_opened: number;
  jobs_clicked: number;
  applications_after_alert: number;
  delivery_rate_pct: number;
  open_rate_pct: number;
  click_rate_pct: number;
  application_rate_pct: number;
  alerts_by_frequency: LabelledCount[];
  range: DateRange;
  freshness: Freshness;
}

/** models.NotificationAnalytics — delivery only; content is never read. */
export interface NotificationAnalytics {
  total_queued: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_clicked: number;
  delivery_rate_pct: number;
  open_rate_pct: number;
  click_through_rate_pct: number;
  failure_rate_pct: number;
  dead_letter_count: number;
  by_channel: LabelledCount[];
  range: DateRange;
  freshness: Freshness;
}

/** models.TrustSafetyAnalytics */
export interface TrustSafetyAnalytics {
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  avg_resolution_time_hours: number;
  moderation_decisions: number;
  restrictions_count: number;
  active_restrictions: number;
  suspensions_count: number;
  appeals_count: number;
  appeals_upheld: number;
  appeals_reversed: number;
  spam_events_detected: number;
  reports_by_category: LabelledCount[];
  reports_by_status: LabelledCount[];
  report_series: TimeSeries;
  range: DateRange;
  freshness: Freshness;
}

/** models.SecurityAnalytics — aggregate only; no credential or token is exposed. */
export interface SecurityAnalytics {
  failed_login_attempts: number;
  successful_logins: number;
  suspicious_events: number;
  session_revocations: number;
  active_sessions: number;
  expired_sessions: number;
  rate_limit_events: number;
  security_events_by_type: LabelledCount[];
  range: DateRange;
  freshness: Freshness;
}

/** models.RetentionAnalytics — D1 through D90 for a signup window. */
export interface RetentionAnalytics {
  cohort_type: string;
  buckets: RetentionBucket[];
  range: DateRange;
  freshness: Freshness;
}

/** models.CohortGridAnalytics — a retention matrix. */
export interface CohortGridAnalytics {
  cohort_type: string;
  period_offsets: number[];
  cohort_items: CohortItem[];
  range: DateRange;
  freshness: Freshness;
}

/** models.DeviceAnalytics — coarse mix only; no device identifier. */
export interface DeviceAnalytics {
  by_platform: LabelledCount[];
  by_source: LabelledCount[];
  range: DateRange;
  freshness: Freshness;
}

/** models.GeographicAnalytics — country level only, below-threshold suppressed. */
export interface GeographicAnalytics {
  by_country: LabelledCount[];
  freshness: Freshness;
}

/** models.SystemPerformanceAnalytics — read from the process metrics collector. */
export interface SystemPerformanceAnalytics {
  request_count: number;
  request_rate_rps: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  avg_latency_ms: number;
  error_count: number;
  error_rate_pct: number;
  db_query_count: number;
  db_latency_ms: number;
  db_error_rate_pct: number;
  cache_latency_ms: number;
  cache_hit_rate_pct: number;
  search_latency_ms: number;
  event_queue_depth: number;
  event_processing_latency_ms: number;
  worker_failures: number;
  uptime_seconds: number;
  telemetry_enabled: boolean;
  /** Observations behind the percentiles; a small window means an unstable figure. */
  sample_window: number;
  freshness: Freshness;
}

/** models.DataQualityIssue */
export interface DataQualityIssue {
  check: string;
  severity: string;
  detail: string;
  count: number;
}

/** models.DataQualityReport */
export interface DataQualityReport {
  checked_at: string;
  events_last_24h: number;
  failed_events: number;
  dead_letter_count: number;
  duplicate_idempotency_keys: number;
  future_timestamps: number;
  unknown_event_names: number;
  stale_aggregate_days: number;
  issues: DataQualityIssue[];
  healthy: boolean;
}

// ---------------------------------------------------------------------------
// Reports, consent and maintenance
// ---------------------------------------------------------------------------

/** models.GenerateReportRequest */
export interface GenerateReportRequest {
  report_type: ReportType;
  export_format?: ExportFormat;
  preset?: DateRangePreset;
  /** YYYY-MM-DD; required together with end_date when preset is 'custom'. */
  start_date?: string;
  end_date?: string;
}

/**
 * models.AnalyticsReport.
 *
 * The download token is never serialised on its own; it only ever arrives
 * embedded in download_url, which is why there is no `download_token` field.
 */
export interface AnalyticsReport {
  id: string;
  admin_id: string;
  report_type: ReportType;
  report_label: string;
  export_format: ExportFormat;
  status: ReportStatus;
  row_count: number;
  file_size_bytes: number;
  download_url?: string;
  download_count: number;
  downloaded_at?: string;
  error_message?: string;
  expires_at: string;
  created_at: string;
}

/** models.ScheduledReportConfig */
export interface ScheduledReportConfig {
  id: string;
  title: string;
  frequency: ScheduleFrequency;
  report_type: ReportType;
  export_format: ExportFormat;
  recipients: string[];
  is_active: boolean;
  created_by: string;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

/** The subset of ScheduledReportConfig a caller supplies on create. */
export interface CreateScheduledReportRequest {
  title: string;
  frequency: ScheduleFrequency;
  report_type: ReportType;
  export_format?: ExportFormat;
  recipients: string[];
  is_active?: boolean;
}

/** models.UserConsentPreferences */
export interface UserConsentPreferences {
  user_id: string;
  essential_telemetry_enabled: boolean;
  optional_analytics_enabled: boolean;
  personalization_enabled: boolean;
  consent_source: string;
  withdrawn_at?: string;
  updated_at: string;
}

/**
 * models.UpdateConsentRequest.
 *
 * Essential telemetry is absent by design: it cannot be switched off, and
 * offering a toggle that is silently ignored would be misleading.
 */
export interface UpdateConsentRequest {
  optional_analytics_enabled: boolean;
  personalization_enabled: boolean;
}

/** models.RetentionCleanupResult */
export interface RetentionCleanupResult {
  raw_events_purged: number;
  failures_purged: number;
  dead_letters_purged: number;
  expired_reports_purged: number;
  retention_days: number;
  executed_at: string;
}

/** models.AggregationResult */
export interface AggregationResult {
  date: string;
  rows_written: number;
  metrics: string[];
  duration_ms: number;
  executed_at: string;
}
