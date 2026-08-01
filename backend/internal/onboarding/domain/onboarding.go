package domain

import (
	"time"

	"github.com/google/uuid"
)

type OnboardingProgress struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	CurrentStep    int       `json:"current_step"`
	CompletedSteps []int     `json:"completed_steps"`
	IsCompleted    bool      `json:"is_completed"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ProfileCompletion struct {
	ID                 uuid.UUID              `json:"id"`
	UserID             uuid.UUID              `json:"user_id"`
	CompletionScore    int                    `json:"completion_score"`
	ResumeScore        int                    `json:"resume_score"`
	SkillScore         int                    `json:"skill_score"`
	MarketDemandScore  int                    `json:"market_demand_score"`
	AIInsights         map[string]interface{} `json:"ai_insights"`
	UpdatedAt          time.Time              `json:"updated_at"`
}

type PersonalInfoDTO struct {
	FirstName           string   `json:"first_name" binding:"required"`
	LastName            string   `json:"last_name" binding:"required"`
	Headline            string   `json:"headline"`
	ProfessionalSummary string   `json:"professional_summary"`
	CurrentLocation     string   `json:"current_location"`
	Country             string   `json:"country"`
	Nationality         string   `json:"nationality"`
	PhoneNumber         string   `json:"phone_number"`
	Timezone            string   `json:"timezone"`
	Languages           []string `json:"languages"`
}

type ProfessionalDetailsDTO struct {
	EmploymentStatus string `json:"employment_status" binding:"required"` // Looking for Work, Employed, Freelancer, Student, Entrepreneur
	CurrentJobTitle  string `json:"current_job_title"`
	YearsExperience  int    `json:"years_experience"`
	Industry         string `json:"industry"`
	Department       string `json:"department"`
	EmploymentType   string `json:"employment_type"`
	ExpectedSalary   string `json:"expected_salary"`
	PreferredCurrency string `json:"preferred_currency"`
	NoticePeriod     string `json:"notice_period"`
	PreferredWorkMode string `json:"preferred_work_mode"` // On-site, Hybrid, Remote
}

type SkillItem struct {
	ID               uuid.UUID `json:"id"`
	Name             string    `json:"name" binding:"required"`
	ProficiencyLevel string    `json:"proficiency_level"` // Beginner, Intermediate, Advanced, Expert
}

type WorkExperienceItem struct {
	ID              uuid.UUID `json:"id"`
	Company         string    `json:"company" binding:"required"`
	JobTitle        string    `json:"job_title" binding:"required"`
	EmploymentType  string    `json:"employment_type"`
	Location        string    `json:"location"`
	StartDate       string    `json:"start_date"`
	EndDate         string    `json:"end_date"`
	IsCurrentJob    bool      `json:"is_current_job"`
	Responsibilities string   `json:"responsibilities"`
	Achievements     string   `json:"achievements"`
}

type EducationItem struct {
	ID           uuid.UUID `json:"id"`
	Institution  string    `json:"institution" binding:"required"`
	Degree       string    `json:"degree" binding:"required"`
	FieldOfStudy string    `json:"field_of_study"`
	StartDate    string    `json:"start_date"`
	EndDate      string    `json:"end_date"`
	Grade        string    `json:"grade"`
	Description  string    `json:"description"`
}

type CertificationItem struct {
	ID                  uuid.UUID `json:"id"`
	CertificationName   string    `json:"certification_name" binding:"required"`
	IssuingOrganization string    `json:"issuing_organization" binding:"required"`
	IssueDate           string    `json:"issue_date"`
	ExpiryDate          string    `json:"expiry_date"`
	CredentialID        string    `json:"credential_id"`
	CredentialURL       string    `json:"credential_url"`
}

type CareerPreferences struct {
	ID                     uuid.UUID `json:"id"`
	UserID                 uuid.UUID `json:"user_id"`
	DesiredJobTitles       []string  `json:"desired_job_titles"`
	PreferredIndustries    []string  `json:"preferred_industries"`
	PreferredCountries     []string  `json:"preferred_countries"`
	PreferredCities        []string  `json:"preferred_cities"`
	RemotePreference       string    `json:"remote_preference"`
	EmploymentTypes        []string  `json:"employment_types"`
	ExpectedSalary         string    `json:"expected_salary"`
	PreferredCurrency      string    `json:"preferred_currency"`
	PreferredCompanySize   string    `json:"preferred_company_size"`
	TravelWillingness      string    `json:"travel_willingness"`
	VisaSponsorshipRequired bool      `json:"visa_sponsorship_required"`
}

type JobAlertPreferences struct {
	ID                  uuid.UUID `json:"id"`
	UserID              uuid.UUID `json:"user_id"`
	Frequency           string    `json:"frequency"`            // Instant, Daily, Weekly, Monthly
	NotificationMethods []string  `json:"notification_methods"` // Email, Push, In-app
}

type ResumeParsedResult struct {
	FileName        string               `json:"file_name"`
	Skills          []string             `json:"skills"`
	WorkExperiences []WorkExperienceItem `json:"work_experiences"`
	Educations      []EducationItem      `json:"educations"`
	Certifications  []CertificationItem  `json:"certifications"`
}

type CommunityRecommendation struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	MemberCount int       `json:"member_count"`
	IsJoined    bool      `json:"is_joined"`
}

type ConnectionRecommendation struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Title       string    `json:"title"`
	Company     string    `json:"company"`
	RoleType    string    `json:"role_type"` // Recruiter, Company, Mentor, Expert
	AvatarURL   string    `json:"avatar_url"`
	IsConnected bool      `json:"is_connected"`
}
