package models

import (
	"time"

	"github.com/google/uuid"
)

// SearchFilters represents the recruiter facets filters.
type SearchFilters struct {
	Skills            []string `json:"skills"`
	ExperienceMin     int      `json:"experienceMin"`
	ExperienceMax     int      `json:"experienceMax"`
	Location          string   `json:"location"`
	Availability      string   `json:"availability"`
	SalaryMin         int      `json:"salaryMin"`
	SalaryMax         int      `json:"salaryMax"`
	Education         string   `json:"education"`
	Certifications    []string `json:"certifications"`
	Industry          string   `json:"industry"`
	JobTitle          string   `json:"jobTitle"`
}

// SearchCriteria wraps text queries with facet parameters.
type SearchCriteria struct {
	Query   string        `json:"query"`
	Filters SearchFilters `json:"filters"`
}

// CandidateSearchResult represents an advanced search record result.
type CandidateSearchResult struct {
	CandidateID    uuid.UUID `json:"candidateId"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Headline       string    `json:"headline"`
	Summary        string    `json:"summary"`
	Location       string    `json:"location"`
	Skills         []string  `json:"skills"`
	ExperienceYrs  int       `json:"experienceYrs"`
	SalaryExpect   int       `json:"salaryExpect"`
	Availability   string    `json:"availability"`
	MatchScore     int       `json:"matchScore"` // Percentage matching rating
}

// SavedCandidate represents bookmarked profiles grouped by list names.
type SavedCandidate struct {
	ID          uuid.UUID `json:"id"`
	RecruiterID uuid.UUID `json:"recruiterId"`
	CandidateID uuid.UUID `json:"candidateId"`
	ListName    string    `json:"listName"`
	CreatedAt   time.Time `json:"createdAt"`
}

// RecruiterNote represents notes appended to candidates.
type RecruiterNote struct {
	ID          uuid.UUID `json:"id"`
	RecruiterID uuid.UUID `json:"recruiterId"`
	CandidateID uuid.UUID `json:"candidateId"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// SearchHistory logs previous recruiter searches.
type SearchHistory struct {
	ID          uuid.UUID     `json:"id"`
	RecruiterID uuid.UUID     `json:"recruiterId"`
	Query       string        `json:"query"`
	Filters     SearchFilters `json:"filters"`
	CreatedAt   time.Time     `json:"createdAt"`
}

// Payload DTOs
type SaveCandidatePayload struct {
	CandidateID uuid.UUID `json:"candidateId" binding:"required"`
	ListName    string    `json:"listName"`
}

type AddNotePayload struct {
	CandidateID uuid.UUID `json:"candidateId" binding:"required"`
	Notes       string    `json:"notes" binding:"required"`
}

type ContactCandidatePayload struct {
	CandidateID uuid.UUID `json:"candidateId" binding:"required"`
	Subject     string    `json:"subject" binding:"required"`
	Body        string    `json:"body" binding:"required"`
}
