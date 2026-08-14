package models

import (
	"time"

	"github.com/google/uuid"
)

// IngestEventRequest represents payload for ingesting a versioned analytics event.
type IngestEventRequest struct {
	EventType      string                 `json:"event_type" binding:"required"`
	EventVersion   string                 `json:"event_version"`
	UserID         *uuid.UUID             `json:"user_id,omitempty"`
	OrganizationID *uuid.UUID             `json:"organization_id,omitempty"`
	EntityType     string                 `json:"entity_type,omitempty"`
	EntityID       string                 `json:"entity_id,omitempty"`
	SessionID      string                 `json:"session_id,omitempty"`
	Source         string                 `json:"source"`
	Platform       string                 `json:"platform"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	IdempotencyKey string                 `json:"idempotency_key,omitempty"`
}

// IngestedEvent represents a persisted analytics event record.
type IngestedEvent struct {
	ID             uuid.UUID              `json:"id" db:"id"`
	EventType      string                 `json:"event_type" db:"event_type"`
	EventVersion   string                 `json:"event_version" db:"event_version"`
	UserID         *uuid.UUID             `json:"user_id,omitempty" db:"user_id"`
	OrganizationID *uuid.UUID             `json:"organization_id,omitempty" db:"organization_id"`
	EntityType     string                 `json:"entity_type,omitempty" db:"entity_type"`
	EntityID       string                 `json:"entity_id,omitempty" db:"entity_id"`
	SessionID      string                 `json:"session_id,omitempty" db:"session_id"`
	Source         string                 `json:"source" db:"source"`
	Platform       string                 `json:"platform" db:"platform"`
	Metadata       map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	IdempotencyKey string                 `json:"idempotency_key,omitempty" db:"idempotency_key"`
	CreatedAt      time.Time              `json:"created_at" db:"created_at"`
}

// UserPersonalAnalytics metrics for individual candidate profile.
type UserPersonalAnalytics struct {
	ProfileViewsCount       int     `json:"profile_views_count"`
	SearchAppearancesCount  int     `json:"search_appearances_count"`
	ApplicationsCount       int     `json:"applications_count"`
	ApplicationsThisWeek    int     `json:"applications_this_week"`
	ApplicationsThisMonth   int     `json:"applications_this_month"`
	SavedJobsCount          int     `json:"saved_jobs_count"`
	InterviewInvitationRate float64 `json:"interview_invitation_rate"`
	OfferRate               float64 `json:"offer_rate"`
	ProfileCompleteness     int     `json:"profile_completeness"`
}

// RecruiterHiringAnalytics metrics for recruiter workspace.
type RecruiterHiringAnalytics struct {
	JobsPostedCount        int               `json:"jobs_posted_count"`
	ApplicationsCount      int               `json:"applications_count"`
	CandidatesViewedCount  int               `json:"candidates_viewed_count"`
	InterviewsCount        int               `json:"interviews_count"`
	OffersCount            int               `json:"offers_count"`
	HiresCount             int               `json:"hires_count"`
	AvgTimeToReviewHours   float64           `json:"avg_time_to_review_hours"`
	ApplicationFunnel      []FunnelStageItem `json:"application_funnel"`
}

// CompanyOverviewAnalytics metrics for company.
type CompanyOverviewAnalytics struct {
	CompanyProfileViewsCount int     `json:"company_profile_views_count"`
	ActiveJobsCount          int     `json:"active_jobs_count"`
	TotalJobViewsCount       int     `json:"total_job_views_count"`
	TotalApplicationsCount   int     `json:"total_applications_count"`
	FollowersCount           int     `json:"followers_count"`
	CandidateConversionRate  float64 `json:"candidate_conversion_rate"`
}

// FunnelStageItem represents step conversion in hiring or signup funnels.
type FunnelStageItem struct {
	Stage      string  `json:"stage"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// CohortItem represents user retention matrix.
type CohortItem struct {
	CohortDate    string  `json:"cohort_date"`
	PeriodOffset  int     `json:"period_offset"`
	UserCount     int     `json:"user_count"`
	RetainedCount int     `json:"retained_count"`
	RetentionRate float64 `json:"retention_rate"`
}

// AdminAnalyticsOverview metrics across the platform.
type AdminAnalyticsOverview struct {
	TotalUsers              int     `json:"total_users"`
	ActiveUsersDAU          int     `json:"active_users_dau"`
	ActiveUsersMAU          int     `json:"active_users_mau"`
	NewUsersToday           int     `json:"new_users_today"`
	VerifiedUsers           int     `json:"verified_users"`
	TotalJobs               int     `json:"total_jobs"`
	TotalApplications       int     `json:"total_applications"`
	TotalConnections        int     `json:"total_connections"`
	TotalMessages           int     `json:"total_messages"`
	TotalAIRequests         int     `json:"total_ai_requests"`
	TotalSafetyReports      int     `json:"total_safety_reports"`
	EventProcessingLatency  float64 `json:"event_processing_latency_ms"`
	DataFreshnessTimestamp string  `json:"data_freshness_timestamp"`
}

// UserGrowthAnalytics details user growth & activation cohorts.
type UserGrowthAnalytics struct {
	TotalRegistrations int          `json:"total_registrations"`
	ActivatedUsers     int          `json:"activated_users"`
	ProfileCompletion  float64      `json:"profile_completion_pct"`
	WeeklyActiveUsers  int          `json:"weekly_active_users"`
	MonthlyActiveUsers int          `json:"monthly_active_users"`
	RetentionRate      float64      `json:"retention_rate_pct"`
	CohortMatrix       []CohortItem `json:"cohort_matrix"`
}

// SkillDemandItem represents skill demand frequency and market share.
type SkillDemandItem struct {
	Skill string  `json:"skill"`
	Count int     `json:"count"`
	Share float64 `json:"share"`
}

// JobMarketAnalytics details job demand and skill trends.
type JobMarketAnalytics struct {
	TotalJobsCreated     int               `json:"total_jobs_created"`
	ActiveJobsCount      int               `json:"active_jobs_count"`
	ExpiredJobsCount     int               `json:"expired_jobs_count"`
	JobsByIndustry       map[string]int    `json:"jobs_by_industry"`
	JobsByEmploymentType map[string]int    `json:"jobs_by_employment_type"`
	JobsByWorkMode       map[string]int    `json:"jobs_by_work_mode"`
	TopSkillsRequested   []SkillDemandItem `json:"top_skills_requested"`
}


// ApplicationFunnelAnalytics details job seeker conversion pipeline.
type ApplicationFunnelAnalytics struct {
	TotalViews        int               `json:"total_views"`
	TotalSaves        int               `json:"total_saves"`
	TotalApplications int               `json:"total_applications"`
	TotalInterviews   int               `json:"total_interviews"`
	TotalOffers       int               `json:"total_offers"`
	TotalHires        int               `json:"total_hires"`
	FunnelStages      []FunnelStageItem `json:"funnel_stages"`
}

// CommunityAnalytics details community membership & engagement.
type CommunityAnalytics struct {
	TotalCommunities   int     `json:"total_communities"`
	TotalMemberships   int     `json:"total_memberships"`
	ActiveMembersCount int     `json:"active_members_count"`
	GrowthRate         float64 `json:"growth_rate_pct"`
	ModerationEvents   int     `json:"moderation_events"`
}

// MessagingMetadataAnalytics details messaging delivery metadata (ZERO content inspection).
type MessagingMetadataAnalytics struct {
	TotalConversations  int     `json:"total_conversations"`
	TotalMessagesSent   int     `json:"total_messages_sent"`
	DeliverySuccessRate float64 `json:"delivery_success_rate_pct"`
	AvgResponseTimeMins float64 `json:"avg_response_time_mins"`
	UnreadMessagesCount int     `json:"unread_messages_count"`
}

// NotificationAnalytics details multi-channel notification performance.
type NotificationAnalytics struct {
	TotalSent         int     `json:"total_sent"`
	TotalDelivered    int     `json:"total_delivered"`
	TotalFailed       int     `json:"total_failed"`
	DeliveryRate      float64 `json:"delivery_rate_pct"`
	ClickThroughRate  float64 `json:"click_through_rate_pct"`
	DeadLetterCount   int     `json:"dead_letter_count"`
}

// RecommendationAnalytics details recommendation engine conversion.
type RecommendationAnalytics struct {
	TotalImpressions int     `json:"total_impressions"`
	TotalClicks      int     `json:"total_clicks"`
	TotalSaves       int     `json:"total_saves"`
	TotalApplies     int     `json:"total_applies"`
	TotalDismissals  int     `json:"total_dismissals"`
	AvgMatchScore    int     `json:"avg_match_score"`
	ConversionRate   float64 `json:"conversion_rate_pct"`
}

// ZeroResultSearchItem tracks terms yielding zero search results.
type ZeroResultSearchItem struct {
	QueryTerm   string    `json:"query_term"`
	SearchCount int       `json:"search_count"`
	LastSearched time.Time `json:"last_searched"`
}

// SearchAnalytics details platform search activity & discovery gaps.
type SearchAnalytics struct {
	TotalSearches     int                    `json:"total_searches"`
	PopularTerms      []string               `json:"popular_terms"`
	ZeroResultSearches []ZeroResultSearchItem `json:"zero_result_searches"`
	SearchToViewRate  float64                `json:"search_to_view_rate_pct"`
	SearchToApplyRate float64                `json:"search_to_apply_rate_pct"`
}

// ScheduledReportConfig defines recurring admin report execution.
type ScheduledReportConfig struct {
	ID             uuid.UUID `json:"id" db:"id"`
	Title          string    `json:"title" db:"title"`
	CronExpression string    `json:"cron_expression" db:"cron_expression"`
	ReportType     string    `json:"report_type" db:"report_type"`
	ExportFormat   string    `json:"export_format" db:"export_format"`
	Recipients     []string  `json:"recipients" db:"recipients"`
	FilterParams   map[string]interface{} `json:"filter_params" db:"filter_params"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	CreatedBy      uuid.UUID `json:"created_by" db:"created_by"`
	LastRunAt      *time.Time`json:"last_run_at,omitempty" db:"last_run_at"`
	NextRunAt      *time.Time`json:"next_run_at,omitempty" db:"next_run_at"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// AnalyticsExportJob represents asynchronous data export request.
type AnalyticsExportJob struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	AdminID       uuid.UUID  `json:"admin_id" db:"admin_id"`
	ExportFormat  string     `json:"export_format" db:"export_format"`
	Status        string     `json:"status" db:"status"`
	DownloadURL   string     `json:"download_url,omitempty" db:"download_url"`
	ExpiresAt     time.Time  `json:"expires_at" db:"expires_at"`
	FileSizeBytes int64      `json:"file_size_bytes" db:"file_size_bytes"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
}

// SanitizeCSVCell prevents CSV formula injection by stripping leading =, +, -, or @.
func SanitizeCSVCell(value string) string {
	if len(value) > 0 {
		switch value[0] {
		case '=', '+', '-', '@':
			return "'" + value
		}
	}
	return value
}

