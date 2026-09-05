package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type ApplicationStage string

const (
	StageDraft       ApplicationStage = "Draft"
	StageApplied     ApplicationStage = "Applied"
	StageViewed      ApplicationStage = "Viewed"
	StageShortlisted ApplicationStage = "Shortlisted"
	StageInterview   ApplicationStage = "Interview"
	StageOffer       ApplicationStage = "Offer"
	StageAccepted    ApplicationStage = "Accepted"
	StageRejected    ApplicationStage = "Rejected"
	StageWithdrawn   ApplicationStage = "Withdrawn"
	StageArchived    ApplicationStage = "Archived"
)

// ValidateTransition validates state machine transitions server-side based on actor role.
func ValidateTransition(from, to ApplicationStage, isCandidate bool) error {
	if from == to {
		return nil
	}

	// Terminal states cannot transition to other states except archiving
	if from == StageWithdrawn || from == StageRejected || from == StageAccepted {
		if to == StageArchived {
			return nil
		}
		return fmt.Errorf("cannot transition from terminal stage %q to %q", from, to)
	}

	if isCandidate {
		// Candidate can only submit (Draft -> Applied), accept an offer (Offer -> Accepted), or withdraw
		if to == StageWithdrawn {
			return nil
		}
		if from == StageDraft && to == StageApplied {
			return nil
		}
		if from == StageOffer && to == StageAccepted {
			return nil
		}
		if to == StageArchived {
			return nil
		}
		return fmt.Errorf("candidate is not authorized to transition application from %q to %q", from, to)
	}

	// Recruiter / System transitions
	switch from {
	case StageApplied:
		if to == StageViewed || to == StageShortlisted || to == StageInterview || to == StageRejected || to == StageArchived {
			return nil
		}
	case StageViewed:
		if to == StageShortlisted || to == StageInterview || to == StageRejected || to == StageArchived {
			return nil
		}
	case StageShortlisted:
		if to == StageInterview || to == StageOffer || to == StageRejected || to == StageArchived {
			return nil
		}
	case StageInterview:
		if to == StageOffer || to == StageRejected || to == StageShortlisted || to == StageArchived {
			return nil
		}
	case StageOffer:
		if to == StageAccepted || to == StageRejected || to == StageArchived {
			return nil
		}
	case StageArchived:
		return errors.New("cannot transition from archived status")
	}

	return fmt.Errorf("invalid application stage transition from %q to %q", from, to)
}

func GetStatusExplanation(status ApplicationStage) string {
	switch status {
	case StageDraft:
		return "Application is in draft mode and has not yet been submitted."
	case StageApplied:
		return "Your application has been submitted and is awaiting recruiter review."
	case StageViewed:
		return "The recruiter has reviewed your application profile and resume."
	case StageShortlisted:
		return "You have passed initial screening and are shortlisted for the role."
	case StageInterview:
		return "You have been invited to an interview. Check your scheduled dates below."
	case StageOffer:
		return "The employer has extended a formal job offer."
	case StageAccepted:
		return "You have accepted the job offer."
	case StageRejected:
		return "The employer has closed this application process."
	case StageWithdrawn:
		return "You have withdrawn this application."
	case StageArchived:
		return "This application has been archived."
	default:
		return "Application is currently being processed."
	}
}

type ApplicationAnswer struct {
	QuestionID   string `json:"question_id"`
	QuestionText string `json:"question_text"`
	Answer       string `json:"answer"`
}

type ApplicationSummary struct {
	ID                uuid.UUID        `json:"id"`
	JobID             uuid.UUID        `json:"job_id"`
	JobTitle          string           `json:"job_title"`
	CompanyID         uuid.UUID        `json:"company_id"`
	CompanyName       string           `json:"company_name"`
	CompanyLogo       string           `json:"company_logo"`
	Location          string           `json:"location"`
	EmploymentType    string           `json:"employment_type"`
	SalaryRange       string           `json:"salary_range"`
	CurrentStatus     ApplicationStage `json:"current_status"`
	StatusExplanation string           `json:"status_explanation,omitempty"`
	AppliedAt         time.Time        `json:"applied_at"`
	LastUpdate        time.Time        `json:"last_update"`
	RecruiterID       *uuid.UUID       `json:"recruiter_id,omitempty"`
	RecruiterName     string           `json:"recruiter_name,omitempty"`
	RecruiterAvatar   string           `json:"recruiter_avatar,omitempty"`
	RecruiterEmail    string           `json:"recruiter_email,omitempty"`
	NextInterviewDate *time.Time       `json:"next_interview_date,omitempty"`
	IsSaved           bool             `json:"is_saved"`
	NotesCount        int              `json:"notes_count"`
	ResumeURL         string           `json:"resume_url,omitempty"`
}

type ApplicationTimelineItem struct {
	ID          uuid.UUID `json:"id"`
	Status      string    `json:"status"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	MovedBy     string    `json:"moved_by"`
}

type ApplicationNote struct {
	ID            uuid.UUID `json:"id"`
	ApplicationID uuid.UUID `json:"application_id"`
	CandidateID   uuid.UUID `json:"candidate_id"`
	NoteText      string    `json:"note_text"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ApplicationDetail struct {
	Summary              ApplicationSummary        `json:"summary"`
	JobDescription       string                    `json:"job_description"`
	Requirements         []string                  `json:"requirements"`
	Skills               []string                  `json:"skills"`
	Timeline             []ApplicationTimelineItem `json:"timeline"`
	SubmittedResume      *CandidateDocument        `json:"submitted_resume,omitempty"`
	SubmittedCoverLetter *CandidateDocument        `json:"submitted_cover_letter,omitempty"`
	CoverLetterText      string                    `json:"cover_letter_text,omitempty"`
	Answers              []ApplicationAnswer       `json:"answers,omitempty"`
	Notes                []ApplicationNote         `json:"notes"`
	Interviews           []CandidateInterview      `json:"interviews"`
	Offer                *JobOfferDTO              `json:"offer,omitempty"`
}

type JobOfferDTO struct {
	ID            uuid.UUID  `json:"id"`
	ApplicationID uuid.UUID  `json:"application_id"`
	PositionTitle string     `json:"position_title"`
	Salary        string     `json:"salary"`
	Currency      string     `json:"currency"`
	Benefits      string     `json:"benefits"`
	JoiningDate   *time.Time `json:"joining_date,omitempty"`
	ContractType  string     `json:"contract_type"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"created_at"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
}

type SavedJobCollectionDTO struct {
	ID          uuid.UUID `json:"id"`
	CandidateID uuid.UUID `json:"candidate_id"`
	Name        string    `json:"name"`
	Color       string    `json:"color"`
	Description string    `json:"description"`
	JobsCount   int       `json:"jobs_count"`
	CreatedAt   time.Time `json:"created_at"`
}

type SavedJobDTO struct {
	ID             uuid.UUID  `json:"id"`
	CandidateID    uuid.UUID  `json:"candidate_id"`
	JobID          uuid.UUID  `json:"job_id"`
	JobTitle       string     `json:"job_title"`
	CompanyName    string     `json:"company_name"`
	CompanyLogo    string     `json:"company_logo"`
	Location       string     `json:"location"`
	SalaryRange    string     `json:"salary_range"`
	EmploymentType string     `json:"employment_type"`
	CollectionID   *uuid.UUID `json:"collection_id,omitempty"`
	CollectionName string     `json:"collection_name,omitempty"`
	Notes          string     `json:"notes"`
	SavedAt        time.Time  `json:"saved_at"`
	IsActive       bool       `json:"is_active"`
}

type JobAlertDTO struct {
	ID             uuid.UUID `json:"id"`
	CandidateID    uuid.UUID `json:"candidate_id"`
	Title          string    `json:"title"`
	Keywords       string    `json:"keywords"`
	JobTitles      []string  `json:"job_titles"`
	Skills         []string  `json:"skills"`
	Location       string    `json:"location"`
	Industry       string    `json:"industry"`
	SalaryMin      int       `json:"salary_min"`
	SalaryMax      int       `json:"salary_max"`
	EmploymentType string    `json:"employment_type"`
	Frequency      string    `json:"frequency"` // 'Instant', 'Daily', 'Weekly'
	ChannelEmail   bool      `json:"channel_email"`
	ChannelPush    bool      `json:"channel_push"`
	ChannelInApp   bool      `json:"channel_in_app"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreateApplicationPayload struct {
	JobID          uuid.UUID           `json:"job_id" binding:"required"`
	ResumeID       *uuid.UUID          `json:"resume_id,omitempty"`
	ResumeURL      string              `json:"resume_url,omitempty"`
	CoverLetter    string              `json:"cover_letter,omitempty"`
	Answers        []ApplicationAnswer `json:"answers,omitempty"`
	Source         string              `json:"source,omitempty"`
	IdempotencyKey string              `json:"idempotency_key,omitempty"`
}

type CreateJobAlertPayload struct {
	Title          string   `json:"title"`
	Keywords       string   `json:"keywords"`
	JobTitles      []string `json:"job_titles"`
	Skills         []string `json:"skills"`
	Location       string   `json:"location"`
	Industry       string   `json:"industry"`
	SalaryMin      int      `json:"salary_min"`
	SalaryMax      int      `json:"salary_max"`
	EmploymentType string   `json:"employment_type"`
	Frequency      string   `json:"frequency"`
	ChannelEmail   bool     `json:"channel_email"`
	ChannelPush    bool     `json:"channel_push"`
	ChannelInApp   bool     `json:"channel_in_app"`
}

type CandidateInterview struct {
	ID             uuid.UUID `json:"id"`
	ApplicationID  uuid.UUID `json:"application_id"`
	JobTitle       string    `json:"job_title"`
	CompanyName    string    `json:"company_name"`
	CompanyLogo    string    `json:"company_logo"`
	Title          string    `json:"title"`
	Status         string    `json:"status"` // 'scheduled', 'completed', 'cancelled'
	ScheduledStart time.Time `json:"scheduled_start"`
	ScheduledEnd   time.Time `json:"scheduled_end"`
	LocationType   string    `json:"location_type"`
	MeetingLink    string    `json:"meeting_link"`
	Notes          string    `json:"notes"`
	Interviewer    string    `json:"interviewer"`
}

type CandidateDocument struct {
	ID           uuid.UUID `json:"id"`
	CandidateID  uuid.UUID `json:"candidate_id"`
	Title        string    `json:"title"`
	DocumentType string    `json:"document_type"` // 'Resume', 'Cover Letter', 'Certificate', 'Portfolio'
	FileURL      string    `json:"file_url"`
	SizeBytes    int64     `json:"size_bytes"`
	FileType     string    `json:"file_type"`
	IsDefault    bool      `json:"is_default"`
	UploadedAt   time.Time `json:"uploaded_at"`
}

type ApplicationStatsDTO struct {
	TotalApplications    int     `json:"total_applications"`
	ActiveApplications   int     `json:"active_applications"`
	InterviewsScheduled  int     `json:"interviews_scheduled"`
	OffersReceived       int     `json:"offers_received"`
	RejectedApplications int     `json:"rejected_applications"`
	WithdrawnCount       int     `json:"withdrawn_count"`
	ResponseRate         float64 `json:"response_rate"`
}

type AIApplicationInsightsDTO struct {
	ApplicationSuccessRate float64  `json:"application_success_rate"`
	ProfileMatchScore      int      `json:"profile_match_score"`
	ResumeMatchScore       int      `json:"resume_match_score"`
	MissingSkills          []string `json:"missing_skills"`
	ImprovementSuggestions []string `json:"improvement_suggestions"`
	RecommendedJobs        []string `json:"recommended_jobs"`
}

type CareerAnalyticsDTO struct {
	ApplicationsSent     int               `json:"applications_sent"`
	InterviewRate        float64           `json:"interview_rate"`
	ResponseRate         float64           `json:"response_rate"`
	TimeToResponseDays   float64           `json:"time_to_response_days"`
	MostAppliedRoles     []CategoryCount   `json:"most_applied_roles"`
	MostAppliedCompanies []CategoryCount   `json:"most_applied_companies"`
	ApplicationTrend     []MonthlyCountDTO `json:"application_trend"`
	StatusFunnel         []FunnelStageDTO  `json:"status_funnel"`
}

type CategoryCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type MonthlyCountDTO struct {
	Month string `json:"month"`
	Count int    `json:"count"`
}

type FunnelStageDTO struct {
	Stage string `json:"stage"`
	Count int    `json:"count"`
}
