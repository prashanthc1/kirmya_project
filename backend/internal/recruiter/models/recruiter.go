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
	ID                 uuid.UUID `json:"id"`
	RecruiterID        uuid.UUID `json:"recruiterId"`
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	Department         string    `json:"department"`
	Location           string    `json:"location"`
	SalaryRange        string    `json:"salaryRange"`
	EmploymentType     string    `json:"employmentType"`
	Status             string    `json:"status"` // 'Active', 'Paused', 'Closed', 'Draft'
	ApplicantsCount    int       `json:"applicantsCount"`
	ViewsCount         int       `json:"viewsCount"`
	Deadline           string    `json:"deadline"`
	CreatedAt          time.Time `json:"createdAt"`
}

// CandidatePipeline tracks candidate progression in the ATS.
type CandidatePipeline struct {
	ID                   uuid.UUID  `json:"id"`
	JobID                uuid.UUID  `json:"jobId"`
	CandidateID          uuid.UUID  `json:"candidateId"`
	CandidateName        string     `json:"candidateName,omitempty"`
	CandidateEmail       string     `json:"candidateEmail,omitempty"`
	Stage                string     `json:"stage"` // 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Technical Round', 'Final Interview', 'Offer', 'Hired', 'Rejected'
	Notes                string     `json:"notes"`
	InterviewScheduledAt *time.Time `json:"interviewScheduledAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

type InterviewItem struct {
	ID              uuid.UUID `json:"id"`
	JobID           uuid.UUID `json:"jobId"`
	CandidateID     uuid.UUID `json:"candidateId"`
	CandidateName   string    `json:"candidateName"`
	Type            string    `json:"type"` // Video, Phone, In-person
	ScheduledAt     time.Time `json:"scheduledAt"`
	DurationMinutes int       `json:"durationMinutes"`
	MeetingLink     string    `json:"meetingLink"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"createdAt"`
}

type CandidateNoteItem struct {
	ID             uuid.UUID `json:"id"`
	CandidateID    uuid.UUID `json:"candidateId"`
	RecruiterID    uuid.UUID `json:"recruiterId"`
	Note           string    `json:"note"`
	Score          int       `json:"score"`
	Recommendation string    `json:"recommendation"`
	CreatedAt      time.Time `json:"createdAt"`
}

type RecruiterCandidateItem struct {
	ID                 uuid.UUID `json:"id"`
	Name               string    `json:"name"`
	Headline           string    `json:"headline"`
	Location           string    `json:"location"`
	Skills             []string  `json:"skills"`
	ExperienceYears    int       `json:"experienceYears"`
	MatchScore         int       `json:"matchScore"`
	Availability       string    `json:"availability"`
	ResumeURL          string    `json:"resumeUrl"`
	Saved              bool      `json:"saved"`
	RecommendationNote string    `json:"recommendationNote"`
}

type RecruiterActivity struct {
	ID           uuid.UUID `json:"id"`
	RecruiterID  uuid.UUID `json:"recruiterId"`
	ActivityType string    `json:"activityType"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"createdAt"`
}

type CreateJobPayload struct {
	Title          string `json:"title" binding:"required"`
	Description    string `json:"description" binding:"required"`
	Department     string `json:"department" binding:"required"`
	Location       string `json:"location" binding:"required"`
	SalaryRange    string `json:"salaryRange" binding:"required"`
	EmploymentType string `json:"employmentType"`
	Deadline       string `json:"deadline"`
}

type UpdateStagePayload struct {
	Stage                string     `json:"stage" binding:"required"`
	Notes                string     `json:"notes,omitempty"`
	InterviewScheduledAt *time.Time `json:"interviewScheduledAt,omitempty"`
}

type ScheduleInterviewPayload struct {
	JobID           string `json:"job_id" binding:"required"`
	CandidateID     string `json:"candidate_id" binding:"required"`
	CandidateName   string `json:"candidate_name" binding:"required"`
	Type            string `json:"type" binding:"required"`
	ScheduledAt     string `json:"scheduled_at" binding:"required"`
	DurationMinutes int    `json:"duration_minutes"`
	MeetingLink     string `json:"meeting_link"`
	Notes           string `json:"notes"`
}

type RecruiterDashboardOverview struct {
	ActiveJobsCount     int                    `json:"activeJobsCount"`
	TotalApplicantsCount int                   `json:"totalApplicantsCount"`
	NewCandidatesCount  int                    `json:"newCandidatesCount"`
	InterviewsScheduled int                    `json:"interviewsScheduled"`
	PendingReviewsCount int                    `json:"pendingReviewsCount"`
	OffersSentCount     int                    `json:"offersSentCount"`
	SuccessfulHiresCount int                   `json:"successfulHiresCount"`
	RecentJobs          []RecruiterJob         `json:"recentJobs"`
	UpcomingInterviews  []InterviewItem        `json:"upcomingInterviews"`
	RecentActivities    []RecruiterActivity    `json:"recentActivities"`
}

type RecruiterAnalytics struct {
	TotalJobsActive      int                 `json:"totalJobsActive"`
	TotalCandidatesCount int                 `json:"totalCandidatesCount"`
	StageDistribution    map[string]int      `json:"stageDistribution"`
	ApplicationTrends    []map[string]any    `json:"applicationTrends"`
	CandidateSources     []map[string]any    `json:"candidateSources"`
	TimeToHireDays       int                 `json:"timeToHireDays"`
	RecentActivities     []RecruiterActivity `json:"recentActivities"`
}
