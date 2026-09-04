package models

import (
	"time"

	"github.com/google/uuid"
)

// JobSummaryDTO represents real job listing data for recommendations.
type JobSummaryDTO struct {
	ID             uuid.UUID  `json:"id"`
	Title          string     `json:"title"`
	Company        string     `json:"company"`
	CompanyID      *uuid.UUID `json:"companyId,omitempty"`
	CompanyLogo    string     `json:"companyLogo,omitempty"`
	Location       string     `json:"location"`
	WorkMode       string     `json:"workMode,omitempty"`
	EmploymentType string     `json:"employmentType,omitempty"`
	SalaryMin      int        `json:"salaryMin,omitempty"`
	SalaryMax      int        `json:"salaryMax,omitempty"`
	Currency       string     `json:"currency,omitempty"`
	Industry       string     `json:"industry,omitempty"`
	RequiredSkills []string   `json:"requiredSkills"`
	IsFeatured     bool       `json:"isFeatured,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

// JobRecommendation represents a computed match recommendation for a candidate.
type JobRecommendation struct {
	ID           uuid.UUID      `json:"id"`
	UserID       uuid.UUID      `json:"userId"`
	JobID        uuid.UUID      `json:"jobId"`
	MatchScore   int            `json:"matchScore"`   // 0-100 percentage
	MatchReasons string         `json:"matchReasons"` // Serialized JSON match factors details
	IsActive     bool           `json:"isActive"`
	CreatedAt    time.Time      `json:"createdAt"`
	JobDetails   *JobSummaryDTO `json:"jobDetails,omitempty"`
}

// RecommendationFeedback logs user likes, dislikes, and dismissals.
type RecommendationFeedback struct {
	ID               uuid.UUID `json:"id"`
	RecommendationID uuid.UUID `json:"recommendationId"`
	UserID           uuid.UUID `json:"userId"`
	FeedbackType     string    `json:"feedbackType"` // like, dislike, dismiss, save
	Comments         string    `json:"comments"`
	CreatedAt        time.Time `json:"createdAt"`
}

// UserJobPreferences represents candidate job preferences.
type UserJobPreferences struct {
	ID                  uuid.UUID `json:"id"`
	UserID              uuid.UUID `json:"userId"`
	PreferredTitles     []string  `json:"preferredTitles"`
	PreferredLocations  []string  `json:"preferredLocations"`
	PreferredIndustries []string  `json:"preferredIndustries"`
	MinSalary           int       `json:"minSalary"`
	Currency            string    `json:"currency"` // AED, USD, etc.
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}

// RecommendedPerson represents a suggested professional connection grounded in real user profiles.
type RecommendedPerson struct {
	UserID            uuid.UUID `json:"userId"`
	FullName          string    `json:"fullName"`
	Username          string    `json:"username"`
	Headline          string    `json:"headline"`
	AvatarURL         string    `json:"avatarUrl"`
	Location          string    `json:"location"`
	Industry          string    `json:"industry"`
	MutualCount       int       `json:"mutualCount"`
	MutualConnections []string  `json:"mutualConnections"`
	SharedSkills      []string  `json:"sharedSkills"`
	MatchScore        int       `json:"matchScore"`
	Reason            string    `json:"reason"`
}

// RecommendedCommunity represents a recommended peer group grounded in real communities.
type RecommendedCommunity struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  string    `json:"description"`
	Category     string    `json:"category"`
	LogoURL      string    `json:"logoUrl"`
	MemberCount  int       `json:"memberCount"`
	SharedSkills []string  `json:"sharedSkills"`
	MatchScore   int       `json:"matchScore"`
	Reason       string    `json:"reason"`
}

// FeedItem represents a personalized item in the unified home feed stream.
type FeedItem struct {
	ID             string                 `json:"id"`
	ItemType       string                 `json:"itemType"` // 'job', 'person', 'community', 'career_tip', 'discussion'
	ItemID         uuid.UUID              `json:"itemId"`
	Title          string                 `json:"title"`
	Subtitle       string                 `json:"subtitle"`
	Description    string                 `json:"description"`
	CategoryTag    string                 `json:"categoryTag"`
	MatchScore     int                    `json:"matchScore"`
	MatchRationale string                 `json:"matchRationale"`
	Metadata       map[string]interface{} `json:"metadata"`
	CreatedAt      time.Time              `json:"createdAt"`
}

// FeedResponse is the paginated response for the home feed stream.
type FeedResponse struct {
	Items      []FeedItem `json:"items"`
	NextCursor string     `json:"nextCursor,omitempty"`
	HasMore    bool       `json:"hasMore"`
	TotalCount int        `json:"totalCount"`
}

// MockJob is maintained as an alias for backwards-compatibility.
type MockJob = JobSummaryDTO
