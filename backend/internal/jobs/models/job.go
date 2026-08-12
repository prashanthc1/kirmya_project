package models

import (
	"time"

	"github.com/google/uuid"
)

// JobSummary is the public shape of a job posting as it appears in a listing.
// It deliberately omits the long-form description, responsibilities and
// requirements: those belong on a job detail page, not in a paginated list.
type JobSummary struct {
	ID    uuid.UUID `json:"id"`
	Title string    `json:"title"`

	CompanyID     *uuid.UUID `json:"company_id,omitempty"`
	CompanyName   string     `json:"company_name,omitempty"`
	CompanyHandle string     `json:"company_handle,omitempty"`
	CompanyLogo   string     `json:"company_logo,omitempty"`

	Location        string `json:"location,omitempty"`
	WorkMode        string `json:"work_mode,omitempty"`
	EmploymentType  string `json:"employment_type,omitempty"`
	ExperienceLevel string `json:"experience_level,omitempty"`
	Department      string `json:"department,omitempty"`

	SalaryRange    string   `json:"salary_range,omitempty"`
	SalaryMin      *float64 `json:"salary_min,omitempty"`
	SalaryMax      *float64 `json:"salary_max,omitempty"`
	SalaryCurrency string   `json:"salary_currency,omitempty"`

	Skills     []string `json:"skills"`
	IsFeatured bool     `json:"is_featured"`

	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// JobSearchQuery carries the public listing filters. Every field is optional;
// the zero value returns the newest active postings.
type JobSearchQuery struct {
	Query           string
	Location        string
	WorkMode        string
	EmploymentType  string
	ExperienceLevel string
	Sort            string
	Page            int
	Limit           int
}

// JobListPage is one page of results plus the counts a client needs to paginate.
type JobListPage struct {
	Data       []JobSummary `json:"data"`
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
	Total      int          `json:"total"`
	TotalPages int          `json:"total_pages"`
}
