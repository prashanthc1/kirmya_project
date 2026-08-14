package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	ItemTypeJob        = "job"
	ItemTypePerson     = "person"
	ItemTypeCommunity  = "community"
	ItemTypeCourse     = "course"
	ItemTypeEvent      = "event"
	ItemTypeCandidate  = "candidate"
	ItemTypeTalentPool = "talent_pool"

	ActionView    = "view"
	ActionClick   = "click"
	ActionApply   = "apply"
	ActionDismiss = "dismiss"
	ActionSave    = "save"
)

type RecommendationItem struct {
	ItemID         uuid.UUID              `json:"item_id"`
	ItemType       string                 `json:"item_type"` // 'job', 'person', 'community', 'course', 'event', 'candidate', 'talent_pool'
	Title          string                 `json:"title"`
	Subtitle       string                 `json:"subtitle"`
	Description    string                 `json:"description"`
	CategoryTag    string                 `json:"category_tag"`
	MatchScore     int                    `json:"match_score"`     // 0 to 100
	MatchRationale string                 `json:"match_rationale"` // "Why recommended"
	FeatureVector  []float64              `json:"feature_vector"`  // 12-element normalized ML vector
	Metadata       map[string]interface{} `json:"metadata"`
}

type Event struct {
	ID        uuid.UUID              `json:"id"`
	UserID    uuid.UUID              `json:"user_id"`
	ItemType  string                 `json:"item_type"`
	ItemID    uuid.UUID              `json:"item_id"`
	Action    string                 `json:"action"` // 'view', 'click', 'apply', 'dismiss', 'save'
	Context   map[string]interface{} `json:"context"`
	CreatedAt time.Time              `json:"created_at"`
}

type ModelWeights struct {
	ID        uuid.UUID         `json:"id"`
	ModelName string            `json:"model_name"`
	Version   string            `json:"version"`
	Weights   map[string]float64 `json:"weights"`
	IsActive  bool              `json:"is_active"`
	TrainedAt time.Time         `json:"trained_at"`
}

type UserPreference struct {
	ID                 uuid.UUID `json:"id"`
	UserID             uuid.UUID `json:"user_id"`
	PreferredSkills    []string  `json:"preferred_skills"`
	PreferredLocations []string  `json:"preferred_locations"`
	DislikedItems      []string  `json:"disliked_items"`
	FeatureVector      []float64 `json:"feature_vector"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type UnifiedRecommendationsResponse struct {
	Jobs        []RecommendationItem `json:"jobs"`
	People      []RecommendationItem `json:"people"`
	Communities []RecommendationItem `json:"communities"`
	Courses     []RecommendationItem `json:"courses"`
	Events      []RecommendationItem `json:"events"`
	Candidates  []RecommendationItem `json:"candidates"`
	TalentPools []RecommendationItem `json:"talent_pools"`
}

type TrackEventPayload struct {
	ItemType string    `json:"item_type" binding:"required"`
	ItemID   uuid.UUID `json:"item_id" binding:"required"`
	Action   string    `json:"action" binding:"required"` // 'view', 'click', 'apply', 'dismiss', 'save'
}

type UpdatePreferencesPayload struct {
	PreferredSkills    []string `json:"preferred_skills"`
	PreferredLocations []string `json:"preferred_locations"`
}

type RecommendationConfig struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	ModelName          string    `json:"modelName" db:"model_name"`
	AlgorithmVersion   string    `json:"algorithmVersion" db:"algorithm_version"`
	SkillMatchWeight   float64   `json:"skillMatchWeight" db:"skill_match_weight"`
	TitleMatchWeight   float64   `json:"titleMatchWeight" db:"title_match_weight"`
	LocationMatchWeight float64  `json:"locationMatchWeight" db:"location_match_weight"`
	IndustryMatchWeight float64  `json:"industryMatchWeight" db:"industry_match_weight"`
	DiversityPenalty   float64   `json:"diversityPenalty" db:"diversity_penalty"`
	CandidatePoolLimit int       `json:"candidatePoolLimit" db:"candidate_pool_limit"`
	MinScoreThreshold  int       `json:"minScoreThreshold" db:"min_score_threshold"`
	IsActive           bool      `json:"isActive" db:"is_active"`
	CreatedAt          time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time `json:"updatedAt" db:"updated_at"`
}

type RecommendationMetricsDaily struct {
	ID               uuid.UUID `json:"id" db:"id"`
	MetricDate       time.Time `json:"metricDate" db:"metric_date"`
	ItemType         string    `json:"itemType" db:"item_type"`
	TotalImpressions int64     `json:"totalImpressions" db:"total_impressions"`
	TotalClicks      int64     `json:"totalClicks" db:"total_clicks"`
	TotalSaves       int64     `json:"totalSaves" db:"total_saves"`
	TotalApplies     int64     `json:"totalApplies" db:"total_applies"`
	TotalDismissals  int64     `json:"totalDismissals" db:"total_dismissals"`
	AvgMatchScore    int       `json:"avgMatchScore" db:"avg_match_score"`
	AvgLatencyMS     int       `json:"avgLatencyMs" db:"avg_latency_ms"`
	CreatedAt        time.Time `json:"createdAt" db:"created_at"`
}

type SkillRecommendation struct {
	SkillName       string `json:"skillName"`
	Category        string `json:"category"`
	DemandScore     int    `json:"demandScore"`     // 0-100
	RelevanceReason string `json:"relevanceReason"`
	TargetJobsCount int    `json:"targetJobsCount"`
}

type CareerGapAnalysis struct {
	TargetRole       string                `json:"targetRole"`
	CurrentSkills    []string              `json:"currentSkills"`
	MissingSkills    []SkillRecommendation `json:"missingSkills"`
	StrengthsSummary string                `json:"strengthsSummary"`
	GapSeverity      string                `json:"gapSeverity"` // Low, Medium, High
	SuggestedActions []string              `json:"suggestedActions"`
}

