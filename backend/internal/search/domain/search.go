package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	CategoryAll         = "all"
	CategoryPeople      = "people"
	CategoryJobs        = "jobs"
	CategoryCompanies   = "companies"
	CategoryCommunities = "communities"
	CategoryCourses     = "courses"
	CategoryEvents      = "events"
)

type SearchResultItem struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"` // 'people', 'job', 'company', 'community', 'course', 'event'
	Title       string                 `json:"title"`
	Subtitle    string                 `json:"subtitle"`
	Description string                 `json:"description"`
	AvatarURL   string                 `json:"avatar_url,omitempty"`
	URL         string                 `json:"url"`
	Score       float64                `json:"score"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type SearchResponse struct {
	Query            string             `json:"query"`
	Category         string             `json:"category"`
	TotalResults     int                `json:"total_results"`
	EngineUsed       string             `json:"engine_used"` // 'postgresql-tsvector' or 'opensearch-v2'
	Results          []SearchResultItem `json:"results"`
	CategoriesCounts map[string]int     `json:"categories_counts"`
}

type SearchSuggestion struct {
	Text     string `json:"text"`
	Category string `json:"category"`
}

type SearchHistoryItem struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	Query          string    `json:"query"`
	CategoryFilter string    `json:"category_filter"`
	ResultsCount   int       `json:"results_count"`
	SearchedAt     time.Time `json:"searched_at"`
}

type SearchPreference struct {
	ID                uuid.UUID              `json:"id"`
	UserID            uuid.UUID              `json:"user_id"`
	SavedQuery        string                 `json:"saved_query"`
	Filters           map[string]interface{} `json:"filters,omitempty"`
	EmailAlertEnabled bool                   `json:"email_alert_enabled"`
	CreatedAt         time.Time              `json:"created_at"`
}

type SaveSearchPreferencePayload struct {
	SavedQuery        string                 `json:"saved_query" binding:"required"`
	Filters           map[string]interface{} `json:"filters"`
	EmailAlertEnabled bool                   `json:"email_alert_enabled"`
}
