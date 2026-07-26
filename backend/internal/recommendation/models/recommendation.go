package models

import (
	"time"

	"github.com/google/uuid"
)

// JobRecommendation represents a computed match recommendation for a candidate.
type JobRecommendation struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"userId"`
	JobID        uuid.UUID `json:"jobId"`
	MatchScore   int       `json:"matchScore"` // 0-100 percentage
	MatchReasons string    `json:"matchReasons"` // Serialized JSON match factors details
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	JobDetails   *MockJob  `json:"jobDetails,omitempty"`
}

// RecommendationFeedback logs user likes, dislikes, and dismissals.
type RecommendationFeedback struct {
	ID               uuid.UUID `json:"id"`
	RecommendationID uuid.UUID `json:"recommendationId"`
	UserID           uuid.UUID `json:"userId"`
	FeedbackType     string    `json:"feedbackType"` // like, dislike, dismiss
	Comments         string    `json:"comments"`
	CreatedAt        time.Time `json:"createdAt"`
}

// UserJobPreferences represents candidate job preferences.
type UserJobPreferences struct {
	ID                 uuid.UUID `json:"id"`
	UserID             uuid.UUID `json:"userId"`
	PreferredTitles    []string  `json:"preferredTitles"`
	PreferredLocations []string  `json:"preferredLocations"`
	PreferredIndustries []string `json:"preferredIndustries"`
	MinSalary          int       `json:"minSalary"`
	Currency           string    `json:"currency"` // AED, USD, etc.
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// MockJob represents a job post description used in the match algorithm.
type MockJob struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	Company        string    `json:"company"`
	Location       string    `json:"location"`
	SalaryMax      int       `json:"salaryMax"`
	Currency       string    `json:"currency"`
	Industry       string    `json:"industry"`
	RequiredSkills []string  `json:"requiredSkills"`
}
