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
