package models

import (
	"time"

	"github.com/google/uuid"
)

// RecruiterOrgProfile identifies a recruiter entity scoped to an organization.
type RecruiterOrgProfile struct {
	ID                 uuid.UUID `json:"id"`
	UserID             uuid.UUID `json:"userId"`
	OrgID              uuid.UUID `json:"orgId"`
	CompanyName        string    `json:"companyName"`
	JobTitle           string    `json:"jobTitle"`
	Department         string    `json:"department"`
	RecruiterRole      string    `json:"recruiterRole"` // 'Organization Owner', 'Hiring Manager', 'Recruiter', 'Recruiter Admin', 'Interviewer', 'Viewer'
	ProfessionalInfo   string    `json:"professionalInfo"`
	ContactPhone       string    `json:"contactPhone"`
	ContactEmail       string    `json:"contactEmail"`
	VerificationStatus string    `json:"verificationStatus"` // 'Pending', 'Verified', 'Rejected'
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type OnboardingPayload struct {
	CompanyName      string `json:"companyName" binding:"required"`
	JobTitle         string `json:"jobTitle" binding:"required"`
	RecruiterRole    string `json:"recruiterRole" binding:"required"`
	Department       string `json:"department"`
	ProfessionalInfo string `json:"professionalInfo"`
	ContactPhone     string `json:"contactPhone"`
	ContactEmail     string `json:"contactEmail" binding:"required"`
}

// RecruiterJob represents jobs posted by recruiters with full fields.
type RecruiterJob struct {
	ID                  uuid.UUID                    `json:"id"`
	OrgID               uuid.UUID                    `json:"orgId"`
	RecruiterID         uuid.UUID                    `json:"recruiterId"`
	HiringManagerID     *uuid.UUID                   `json:"hiringManagerId,omitempty"`
	Title               string                       `json:"title"`
	Department          string                       `json:"department"`
	EmploymentType      string                       `json:"employmentType"` // Full-time, Part-time, Contract, Internship
	WorkplaceType       string                       `json:"workplaceType"`  // On-site, Hybrid, Remote
	Location            string                       `json:"location"`
	SalaryRange         string                       `json:"salaryRange"`
	Currency            string                       `json:"currency"`
	ExperienceLevel     string                       `json:"experienceLevel"` // Entry, Mid, Senior, Lead, Executive
	RequiredSkills      []string                     `json:"requiredSkills"`
	PreferredSkills     []string                     `json:"preferredSkills"`
	Education           string                       `json:"education"`
	Certifications      []string                     `json:"certifications"`
	Description         string                       `json:"description"`
	Responsibilities    string                       `json:"responsibilities"`
	Qualifications      string                       `json:"qualifications"`
	Benefits            string                       `json:"benefits"`
	Deadline            string                       `json:"deadline"`
	OpeningsCount       int                          `json:"openingsCount"`
	Status              string                       `json:"status"` // 'Draft', 'Active', 'Paused', 'Closed', 'Archived'
	ApplicantsCount     int                          `json:"applicantsCount"`
	ViewsCount          int                          `json:"viewsCount"`
	Questions           []JobApplicationQuestionDTO `json:"questions,omitempty"`
	CreatedAt           time.Time                    `json:"createdAt"`
	UpdatedAt           time.Time                    `json:"updatedAt"`
}

type CreateJobPayload struct {
	Title            string                       `json:"title" binding:"required"`
	Department       string                       `json:"department"`
	EmploymentType   string                       `json:"employmentType"`
	WorkplaceType    string                       `json:"workplaceType"`
	Location         string                       `json:"location"`
	SalaryRange      string                       `json:"salaryRange"`
	Currency         string                       `json:"currency"`
	ExperienceLevel  string                       `json:"experienceLevel"`
	RequiredSkills   []string                     `json:"requiredSkills"`
	PreferredSkills  []string                     `json:"preferredSkills"`
	Education        string                       `json:"education"`
	Certifications   []string                     `json:"certifications"`
	Description      string                       `json:"description" binding:"required"`
	Responsibilities string                       `json:"responsibilities"`
	Qualifications   string                       `json:"qualifications"`
	Benefits         string                       `json:"benefits"`
	Deadline         string                       `json:"deadline"`
	OpeningsCount    int                          `json:"openingsCount"`
	HiringManagerID  string                       `json:"hiringManagerId"`
	Status           string                       `json:"status"` // 'Active', 'Draft'
	Questions        []JobApplicationQuestionDTO `json:"questions"`
}

type JobApplicationQuestionDTO struct {
	ID           uuid.UUID `json:"id"`
	JobID        uuid.UUID `json:"jobId"`
	QuestionText string    `json:"questionText"`
	QuestionType string    `json:"questionType"` // Text, LongText, SingleChoice, MultipleChoice, YesNo, Number, Date, FileUpload
	Options      []string  `json:"options"`
	IsRequired   bool      `json:"isRequired"`
	DisplayOrder int       `json:"displayOrder"`
}

type CandidatePipeline struct {
	ID                   uuid.UUID  `json:"id"`
	JobID                uuid.UUID  `json:"jobId"`
	CandidateID          uuid.UUID  `json:"candidateId"`
	CandidateName        string     `json:"candidateName,omitempty"`
	CandidateEmail       string     `json:"candidateEmail,omitempty"`
	CandidateAvatar      string     `json:"candidateAvatar,omitempty"`
	Stage                string     `json:"stage"` // 'New', 'Review', 'Shortlisted', 'Recruiter Screen', 'Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected', 'Withdrawn'
	Notes                string     `json:"notes"`
	InterviewScheduledAt *time.Time `json:"interviewScheduledAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

type InterviewItem struct {
	ID              uuid.UUID `json:"id"`
	JobID           uuid.UUID `json:"jobId"`
	CandidateID     uuid.UUID `json:"candidateId"`
	CandidateName   string    `json:"candidateName"`
	CandidateAvatar string    `json:"candidateAvatar,omitempty"`
	Type            string    `json:"type"` // Video, Phone, In-person
	ScheduledAt     time.Time `json:"scheduledAt"`
	DurationMinutes int       `json:"durationMinutes"`
	MeetingLink     string    `json:"meetingLink"`
	Instructions    string    `json:"instructions"`
	Notes           string    `json:"notes"`
	Status          string    `json:"status"` // Scheduled, Completed, Cancelled
	CreatedAt       time.Time `json:"createdAt"`
}

type CandidateNoteItem struct {
	ID             uuid.UUID `json:"id"`
	CandidateID    uuid.UUID `json:"candidateId"`
	RecruiterID    uuid.UUID `json:"recruiterId"`
	RecruiterName  string    `json:"recruiterName"`
	Note           string    `json:"note"`
	Score          int       `json:"score"`
	Recommendation string    `json:"recommendation"`
	IsPinned       bool      `json:"isPinned"`
	CreatedAt      time.Time `json:"createdAt"`
}

type CandidateTagDTO struct {
	ID    uuid.UUID `json:"id"`
	OrgID uuid.UUID `json:"orgId"`
	Name  string    `json:"name"`
	Color string    `json:"color"`
}

type RecruiterCandidateItem struct {
	ID                 uuid.UUID         `json:"id"`
	Name               string            `json:"name"`
	Headline           string            `json:"headline"`
	CurrentRole        string            `json:"currentRole"`
	Location           string            `json:"location"`
	Skills             []string          `json:"skills"`
	ExperienceYears    int               `json:"experienceYears"`
	MatchScore         int               `json:"matchScore"`
	Availability       string            `json:"availability"`
	OpenToWork         bool              `json:"openToWork"`
	ResumeURL          string            `json:"resumeUrl"`
	ResumeAvailable    bool              `json:"resumeAvailable"`
	VerificationStatus string            `json:"verificationStatus"`
	Tags               []CandidateTagDTO `json:"tags"`
	Saved              bool              `json:"saved"`
	RecommendationNote string            `json:"recommendationNote"`
}

type CandidateMatchAnalysisDTO struct {
	JobID               uuid.UUID `json:"jobId"`
	CandidateID         uuid.UUID `json:"candidateId"`
	CandidateName       string    `json:"candidateName"`
	OverallMatchScore   int       `json:"overallMatchScore"`
	SkillsMatch         int       `json:"skillsMatch"`
	ExperienceMatch     int       `json:"experienceMatch"`
	EducationMatch      int       `json:"educationMatch"`
	LocationMatch       int       `json:"locationMatch"`
	RoleMatch           int       `json:"roleMatch"`
	CareerAlignment     int       `json:"careerAlignment"`
	MissingRequirements []string  `json:"missingRequirements"`
	PotentialConcerns   []string  `json:"potentialConcerns"`
	TransferableSkills  []string  `json:"transferableSkills"`
	ExplanationNotes    string    `json:"explanationNotes"`
}

type RecruiterActivity struct {
	ID           uuid.UUID `json:"id"`
	RecruiterID  uuid.UUID `json:"recruiterId"`
	ActivityType string    `json:"activityType"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"createdAt"`
}

type UpdateStagePayload struct {
	Stage                string     `json:"stage" binding:"required"`
	Notes                string     `json:"notes,omitempty"`
	InterviewScheduledAt *time.Time `json:"interviewScheduledAt,omitempty"`
}

type ScheduleInterviewPayload struct {
	JobID           string   `json:"job_id" binding:"required"`
	CandidateID     string   `json:"candidate_id" binding:"required"`
	CandidateName   string   `json:"candidate_name" binding:"required"`
	Type            string   `json:"type" binding:"required"`
	ScheduledAt     string   `json:"scheduled_at" binding:"required"`
	DurationMinutes int      `json:"duration_minutes"`
	MeetingLink     string   `json:"meeting_link"`
	Instructions    string   `json:"instructions"`
	Notes           string   `json:"notes"`
	InterviewerIDs  []string `json:"interviewer_ids"`
}

type MessageTemplateDTO struct {
	ID        uuid.UUID `json:"id"`
	OrgID     uuid.UUID `json:"orgId"`
	Title     string    `json:"title"`
	Subject   string    `json:"subject"`
	Body      string    `json:"body"`
	Category  string    `json:"category"`
	CreatedBy uuid.UUID `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`
}

type TeamMemberDTO struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"userId"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	RecruiterRole string    `json:"recruiterRole"`
	Department    string    `json:"department"`
	Status        string    `json:"status"`
	JoinedAt      time.Time `json:"joinedAt"`
}

type RecruiterDashboardOverview struct {
	ActiveJobsCount       int                    `json:"activeJobsCount"`
	DraftJobsCount        int                    `json:"draftJobsCount"`
	TotalApplicantsCount  int                    `json:"totalApplicantsCount"`
	NewCandidatesCount    int                    `json:"newCandidatesCount"`
	ShortlistedCount      int                    `json:"shortlistedCount"`
	InterviewsScheduled   int                    `json:"interviewsScheduled"`
	OffersCount           int                    `json:"offersCount"`
	SuccessfulHiresCount  int                    `json:"successfulHiresCount"`
	ExpiringJobsCount     int                    `json:"expiringJobsCount"`
	RecentJobs            []RecruiterJob         `json:"recentJobs"`
	UpcomingInterviews    []InterviewItem        `json:"upcomingInterviews"`
	RecentActivities      []RecruiterActivity    `json:"recentActivities"`
}

type RecruiterAnalytics struct {
	TotalJobsActive      int                 `json:"totalJobsActive"`
	TotalCandidatesCount int                 `json:"totalCandidatesCount"`
	ApplicationsCount    int                 `json:"applicationsCount"`
	ConversionRate       float64             `json:"conversionRate"`
	ShortlistRate        float64             `json:"shortlistRate"`
	InterviewRate        float64             `json:"interviewRate"`
	OfferRate            float64             `json:"offerRate"`
	HireRate             float64             `json:"hireRate"`
	TimeToFirstReviewDays int                `json:"timeToFirstReviewDays"`
	TimeToInterviewDays  int                 `json:"timeToInterviewDays"`
	TimeToHireDays       int                 `json:"timeToHireDays"`
	StageDistribution    map[string]int      `json:"stageDistribution"`
	ApplicationTrends    []map[string]any    `json:"applicationTrends"`
	CandidateSources     []map[string]any    `json:"candidateSources"`
	RecentActivities     []RecruiterActivity `json:"recentActivities"`
}
