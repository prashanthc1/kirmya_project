package models

import (
	"time"

	"github.com/google/uuid"
)

// RecruiterProfile identifies a recruiter entity.
type RecruiterProfile struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"userId"`
	CompanyName string    `json:"companyName"`
	Verified    bool      `json:"verified"`
	CreatedAt   time.Time `json:"createdAt"`
}

// RecruiterJob represents jobs posted by recruiters.
type RecruiterJob struct {
	ID          uuid.UUID `json:"id"`
	RecruiterID uuid.UUID `json:"recruiterId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Department  string    `json:"department"`
	Location    string    `json:"location"`
	SalaryRange string    `json:"salaryRange"`
	Status      string    `json:"status"` // 'active', 'closed'
	CreatedAt   time.Time `json:"createdAt"`
}

// CandidatePipeline tracks candidate progression.
type CandidatePipeline struct {
	ID                   uuid.UUID  `json:"id"`
	JobID                uuid.UUID  `json:"jobId"`
	CandidateID          uuid.UUID  `json:"candidateId"`
	CandidateName        string     `json:"candidateName,omitempty"`  // Aggregated field
	CandidateEmail       string     `json:"candidateEmail,omitempty"` // Aggregated field
	Stage                string     `json:"stage"`                    // 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
	Notes                string     `json:"notes"`
	InterviewScheduledAt *time.Time `json:"interviewScheduledAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

// RecruiterActivity logs auditing entries.
type RecruiterActivity struct {
	ID           uuid.UUID `json:"id"`
	RecruiterID  uuid.UUID `json:"recruiterId"`
	ActivityType string    `json:"activityType"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"createdAt"`
}

// DTO Payloads
type CreateJobPayload struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	Department  string `json:"department" binding:"required"`
	Location    string `json:"location" binding:"required"`
	SalaryRange string `json:"salaryRange" binding:"required"`
}

type UpdateStagePayload struct {
	Stage                string     `json:"stage" binding:"required"`
	Notes                string     `json:"notes,omitempty"`
	InterviewScheduledAt *time.Time `json:"interviewScheduledAt,omitempty"`
}

type RecruiterAnalytics struct {
	TotalJobsActive      int                     `json:"totalJobsActive"`
	TotalCandidatesCount int                     `json:"totalCandidatesCount"`
	StageDistribution    map[string]int          `json:"stageDistribution"`
	RecentActivities     []RecruiterActivity     `json:"recentActivities"`
}
