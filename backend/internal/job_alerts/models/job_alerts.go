package models

import (
	"time"

	"github.com/google/uuid"
)

// JobAlert represents a candidate's automated job alert definition.
type JobAlert struct {
	ID                uuid.UUID  `json:"id"`
	CandidateID       uuid.UUID  `json:"candidate_id"`
	Title             string     `json:"title"`
	Keywords          string     `json:"keywords"`
	JobTitles         []string   `json:"job_titles"`
	Skills            []string   `json:"skills"`
	Location          string     `json:"location"`
	Industry          string     `json:"industry"`
	Departments       []string   `json:"departments"`
	SalaryMin         int        `json:"salary_min"`
	SalaryMax         int        `json:"salary_max"`
	EmploymentType    string     `json:"employment_type"`
	ExperienceLevel   string     `json:"experience_level"`
	Country           string     `json:"country"`
	City              string     `json:"city"`
	RemotePreference  string     `json:"remote_preference"`
	CompanySize       string     `json:"company_size"`
	CompanyType       string     `json:"company_type"`
	VisaSponsorship   bool       `json:"visa_sponsorship"`
	WorkAuthorization string     `json:"work_authorization"`
	EducationLevel    string     `json:"education_level"`
	Languages         []string   `json:"languages"`
	ExcludeKeywords   string     `json:"exclude_keywords"`
	Frequency         string     `json:"frequency"` // Immediately, Every Hour, Daily, Weekly, Custom
	CustomSchedule    string     `json:"custom_schedule"`
	ChannelEmail      bool       `json:"channel_email"`
	ChannelPush       bool       `json:"channel_push"`
	ChannelInApp      bool       `json:"channel_in_app"`
	ChannelSMS        bool       `json:"channel_sms"`
	ChannelWebhook    bool       `json:"channel_webhook"`
	IsActive          bool       `json:"is_active"`
	ExpiryDate        *time.Time `json:"expiry_date,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// SavedSearch represents a user's bookmarked search query and filters.
type SavedSearch struct {
	ID         uuid.UUID              `json:"id"`
	UserID     uuid.UUID              `json:"user_id"`
	Name       string                 `json:"name"`
	QueryText  string                 `json:"query_text"`
	Filters    map[string]interface{} `json:"filters"`
	AutoAlert  bool                   `json:"auto_alert"`
	AlertID    *uuid.UUID             `json:"alert_id,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

// JobMatchScore breakdown for a specific job recommendation.
type JobMatchScore struct {
	OverallScore   int      `json:"overall_score"` // 0-100
	SkillsMatch    int      `json:"skills_match"`
	ExperienceMatch int     `json:"experience_match"`
	EducationMatch  int     `json:"education_match"`
	SalaryMatch     int     `json:"salary_match"`
	LocationMatch   int     `json:"location_match"`
	IndustryMatch   int     `json:"industry_match"`
	GrowthScore     int     `json:"growth_score"`
	CompanyFitScore int     `json:"company_fit_score"`
	ConfidenceScore int     `json:"confidence_score"`
	MatchReasons    []string `json:"match_reasons"`
	MatchingSkills  []string `json:"matching_skills"`
	MissingSkills   []string `json:"missing_skills"`
}

// JobRecommendation represents a single job recommendation returned to candidate.
type JobRecommendation struct {
	ID                    uuid.UUID     `json:"id"`
	JobID                 uuid.UUID     `json:"job_id"`
	Title                 string        `json:"title"`
	CompanyName           string        `json:"company_name"`
	CompanyLogo           string        `json:"company_logo"`
	CompanyVerified       bool          `json:"company_verified"`
	Location              string        `json:"location"`
	SalaryRange           string        `json:"salary_range"`
	SalaryComparison      string        `json:"salary_comparison"`
	EmploymentType        string        `json:"employment_type"`
	RemoteCompatibility   string        `json:"remote_compatibility"`
	ExperienceRequired    string        `json:"experience_required"`
	ApplicationDeadline   time.Time     `json:"application_deadline"`
	RecruiterActivity     string        `json:"recruiter_activity"`
	ApplicationDifficulty string        `json:"application_difficulty"`
	SectionTag            string        `json:"section_tag"` // Recommended For You, High Match Jobs, Remote Jobs, Jobs Near You, Based On Your Skills, etc.
	Score                 JobMatchScore `json:"score"`
	IsSaved               bool          `json:"is_saved"`
	IsApplied             bool          `json:"is_applied"`
	CreatedAt             time.Time     `json:"created_at"`
}

// RecommendationFeedback represents explicit candidate feedback on a recommendation.
type RecommendationFeedbackRequest struct {
	JobID            uuid.UUID `json:"job_id"`
	RecommendationID *uuid.UUID `json:"recommendation_id,omitempty"`
	ActionType       string    `json:"action_type"` // interested, not_interested, hide_company, hide_role, already_applied, too_senior, too_junior, wrong_location, wrong_salary
	FeedbackReason   string    `json:"feedback_reason,omitempty"`
}

// AlertDeliveryHistory record of sent alerts and engagement.
type AlertDeliveryHistory struct {
	ID                    uuid.UUID `json:"id"`
	AlertID               uuid.UUID `json:"alert_id"`
	CandidateID           uuid.UUID `json:"candidate_id"`
	AlertTitle            string    `json:"alert_title"`
	DeliveryChannel       string    `json:"delivery_channel"`
	JobsIncluded          int       `json:"jobs_included"`
	JobsOpened            int       `json:"jobs_opened"`
	JobsClicked           int       `json:"jobs_clicked"`
	ApplicationsSubmitted int       `json:"applications_submitted"`
	DeliveryStatus        string    `json:"delivery_status"`
	SentAt                time.Time `json:"sent_at"`
}

// CandidateCareerPreferences domain model.
type CandidateCareerPreferences struct {
	ID                    uuid.UUID `json:"id"`
	CandidateID           uuid.UUID `json:"candidate_id"`
	OpenToWorkStatus      string    `json:"open_to_work_status"`
	TargetJobTitles       []string  `json:"target_job_titles"`
	PreferredLocations    []string  `json:"preferred_locations"`
	RemotePreference      string    `json:"remote_preference"`
	SalaryMin             int       `json:"salary_min"`
	SalaryMax             int       `json:"salary_max"`
	PreferredCompanySizes []string  `json:"preferred_company_sizes"`
	PreferredIndustries   []string  `json:"preferred_industries"`
	AvailabilityStatus    string    `json:"availability_status"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// CareerInsights DTO.
type CareerInsights struct {
	HiringTrends              []NameCount        `json:"hiring_trends"`
	MostDemandedSkills        []NameCount        `json:"most_demanded_skills"`
	EmergingRoles             []NameCount        `json:"emerging_roles"`
	SalaryTrends              []SalaryTrendPoint `json:"salary_trends"`
	IndustryGrowth            []NameCount        `json:"industry_growth"`
	LocationDemand            []NameCount        `json:"location_demand"`
	CareerProgressSuggestions []string           `json:"career_progress_suggestions"`
	MissingSkills             []string           `json:"missing_skills"`
	RecommendedCertifications []string           `json:"recommended_certifications"`
	RecommendedLearningPaths  []string           `json:"recommended_learning_paths"`
	RecommendedCommunities    []string           `json:"recommended_communities"`
	RecommendedConnections    []string           `json:"recommended_connections"`
}

type NameCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type SalaryTrendPoint struct {
	Role      string `json:"role"`
	AvgSalary int    `json:"avg_salary"`
	GrowthPct float64 `json:"growth_pct"`
}

// RecommendationScorer is a pluggable interface allowing seamless future ML model replacement.
type RecommendationScorer interface {
	CalculateMatch(candidateCandidateID uuid.UUID, candidateSkills []string, candidatePrefs CandidateCareerPreferences, jobData map[string]interface{}) JobMatchScore
}
