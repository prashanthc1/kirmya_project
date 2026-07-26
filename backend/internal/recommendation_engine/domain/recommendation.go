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
