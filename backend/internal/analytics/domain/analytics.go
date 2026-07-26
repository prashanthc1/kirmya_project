package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	EventProfileView          = "profile_view"
	EventJobView              = "job_view"
	EventApplicationSubmitted = "application_submitted"
	EventCandidateHired       = "hired"
	EventSearchAppearance     = "search_appearance"

	MetricUserGrowth         = "user_growth"
	MetricSkillDemand        = "skill_demand"
	MetricHiringSpeed        = "hiring_speed"
	MetricCandidateConversion = "candidate_conversion"
	MetricProfileViews       = "profile_views"
)

type AnalyticsEvent struct {
	ID         uuid.UUID              `json:"id"`
	TenantID   uuid.UUID              `json:"tenant_id"`
	UserID     uuid.UUID              `json:"user_id"`
	EventName  string                 `json:"event_name"`
	EntityID   string                 `json:"entity_id,omitempty"`
	Properties map[string]interface{} `json:"properties,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
}

type AggregatedMetric struct {
	ID           uuid.UUID `json:"id"`
	TenantID     uuid.UUID `json:"tenant_id"`
	MetricType   string    `json:"metric_type"`
	PeriodDate   string    `json:"period_date"`
	DimensionKey string    `json:"dimension_key"`
	MetricValue  float64   `json:"metric_value"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type SkillDemandItem struct {
	Skill string  `json:"skill"`
	Count int     `json:"count"`
	Share float64 `json:"share"`
}

type AdminAnalytics struct {
	TotalUsers         int               `json:"total_users"`
	ActiveUsers        int               `json:"active_users"`
	UserGrowthRate     float64           `json:"user_growth_rate"`
	TotalJobOpenings   int               `json:"total_job_openings"`
	HiringVelocityDays float64           `json:"hiring_velocity_days"`
	SkillDemandHeatmap []SkillDemandItem `json:"skill_demand_heatmap"`
	MarketTrendSummary string            `json:"market_trend_summary"`
}

type ConversionStage struct {
	Stage      string  `json:"stage"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

type RecruiterAnalytics struct {
	TotalCandidatesScreened int               `json:"total_candidates_screened"`
	AvgTimeToHireDays       float64           `json:"avg_time_to_hire_days"`
	ApplicationToOfferRate  float64           `json:"application_to_offer_rate"`
	CandidateFunnel         []ConversionStage `json:"candidate_funnel"`
	TopPerformingJob        string            `json:"top_performing_job"`
	JobViewsCount           int               `json:"job_views_count"`
}

type UserAnalytics struct {
	ProfileViewsCount       int     `json:"profile_views_count"`
	SearchAppearancesCount  int     `json:"search_appearances_count"`
	ApplicationsCount       int     `json:"applications_count"`
	InterviewInvitationRate float64 `json:"interview_invitation_rate"`
	ProfileCompleteness     int     `json:"profile_completeness"`
	TopSearchingCompanies   []string `json:"top_searching_companies"`
}

type TrackEventPayload struct {
	EventName  string                 `json:"event_name" binding:"required"`
	EntityID   string                 `json:"entity_id"`
	Properties map[string]interface{} `json:"properties"`
}
