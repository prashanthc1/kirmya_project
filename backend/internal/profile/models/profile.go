package models

import (
	"time"

	"github.com/google/uuid"
)

// UserProfile represents the complete candidate identity, header, and portfolio.
type UserProfile struct {
	ID                         uuid.UUID            `json:"id"`
	UserID                     uuid.UUID            `json:"userId"`
	Username                   string               `json:"username"`
	FirstName                  string               `json:"firstName,omitempty"`
	LastName                   string               `json:"lastName,omitempty"`
	AvatarURL                  string               `json:"avatarUrl"`
	CoverURL                   string               `json:"coverUrl"`
	Headline                   string               `json:"headline"`
	Summary                    string               `json:"summary"`
	Location                   string               `json:"location"`
	Country                    string               `json:"country"`
	Industry                   string               `json:"industry"`
	CurrentPosition            string               `json:"currentPosition"`
	AvailabilityStatus         string               `json:"availabilityStatus"` // open_to_work, available_for_freelance, looking_for_networking, hiring
	OpenToWork                 bool                 `json:"openToWork"`
	OpenToRecruiters           bool                 `json:"openToRecruiters"`
	TargetRoles                []string             `json:"targetRoles"`
	PreferredLocations         []string             `json:"preferredLocations"`
	ProfileCompletedPercentage int                  `json:"profileCompletedPercentage"`
	Volunteering               string               `json:"volunteering"`
	Publications               string               `json:"publications"`
	Licenses                   string               `json:"licenses"`
	VerificationStatus         string               `json:"verificationStatus"` // unverified, pending, verified, rejected
	VerificationNotes          string               `json:"verificationNotes,omitempty"`
	IsRestricted               bool                 `json:"isRestricted"`
	IsPrivate                  bool                 `json:"isPrivate"`
	ProfileViewsCount          int                  `json:"profileViewsCount"`
	SearchAppearancesCount     int                  `json:"searchAppearancesCount"`
	CreatedAt                  time.Time            `json:"createdAt"`
	UpdatedAt                  time.Time            `json:"updatedAt"`

	WorkExperiences []UserWorkExperience `json:"workExperiences,omitempty"`
	Educations      []UserEducation      `json:"educations,omitempty"`
	Skills          []UserSkill          `json:"skills,omitempty"`
	Certifications  []UserCertification  `json:"certifications,omitempty"`
	Projects        []UserProject        `json:"projects,omitempty"`
	Languages       []UserLanguage       `json:"languages,omitempty"`
	Achievements    []UserAchievement    `json:"achievements,omitempty"`
}

// UserWorkExperience represents employment history.
type UserWorkExperience struct {
	ID               uuid.UUID  `json:"id"`
	ProfileID        uuid.UUID  `json:"profileId"`
	Company          string     `json:"company"`
	JobTitle         string     `json:"jobTitle"`
	EmploymentType   string     `json:"employmentType"`
	Location         string     `json:"location"`
	StartDate        time.Time  `json:"startDate"`
	EndDate          *time.Time `json:"endDate,omitempty"`
	IsCurrentJob     bool       `json:"isCurrentJob"`
	Description      string     `json:"description"`
	SkillsUsed       []string   `json:"skillsUsed"`
	Achievements     string     `json:"achievements"`
	SortOrder        int        `json:"sortOrder"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// UserEducation represents academic degrees and credentials.
type UserEducation struct {
	ID           uuid.UUID  `json:"id"`
	ProfileID    uuid.UUID  `json:"profileId"`
	Institution  string     `json:"institution"`
	Degree       string     `json:"degree"`
	FieldOfStudy string     `json:"fieldOfStudy"`
	StartDate    *time.Time `json:"startDate,omitempty"`
	EndDate      *time.Time `json:"endDate,omitempty"`
	Grade        string     `json:"grade"`
	Description  string     `json:"description"`
	SortOrder    int        `json:"sortOrder"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// UserSkill represents a technical or professional capability.
type UserSkill struct {
	ID               uuid.UUID `json:"id"`
	ProfileID        uuid.UUID `json:"profileId"`
	Name             string    `json:"name"`
	ProficiencyLevel string    `json:"proficiencyLevel"` // Beginner, Intermediate, Expert
}

// UserCertification represents a professional license or certificate.
type UserCertification struct {
	ID                  uuid.UUID  `json:"id"`
	ProfileID           uuid.UUID  `json:"profileId"`
	Name                string     `json:"name"`
	IssuingOrganization string     `json:"issuingOrganization"`
	IssueDate           *time.Time `json:"issueDate"`
	ExpirationDate      *time.Time `json:"expirationDate"`
	CredentialID        string     `json:"credentialId"`
	CredentialURL       string     `json:"credentialUrl"`
}

// UserProject represents portfolio projects.
type UserProject struct {
	ID          uuid.UUID  `json:"id"`
	ProfileID   uuid.UUID  `json:"profileId"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	URL         string     `json:"url"`
	StartDate   *time.Time `json:"startDate"`
	EndDate     *time.Time `json:"endDate"`
}

// UserLanguage represents spoken/written languages.
type UserLanguage struct {
	ID          uuid.UUID `json:"id"`
	ProfileID   uuid.UUID `json:"profileId"`
	Name        string    `json:"name"`
	Proficiency string    `json:"proficiency"`
}

// UserAchievement represents milestones, patents, and awards.
type UserAchievement struct {
	ID           uuid.UUID  `json:"id"`
	ProfileID    uuid.UUID  `json:"profileId"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	DateAchieved *time.Time `json:"dateAchieved"`
}

// UserPreference represents profile privacy settings.
type UserPreference struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"userId"`
	ProfileVisibility string    `json:"profileVisibility"` // public, connections_only, private
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// DTOs for REST API requests
type UpdateProfileDTO struct {
	Username           string   `json:"username"`
	Headline           string   `json:"headline"`
	Summary            string   `json:"summary"`
	Location           string   `json:"location"`
	Country            string   `json:"country"`
	Industry           string   `json:"industry"`
	CurrentPosition    string   `json:"currentPosition"`
	AvailabilityStatus string   `json:"availabilityStatus"`
	OpenToWork         bool     `json:"openToWork"`
	OpenToRecruiters   bool     `json:"openToRecruiters"`
	TargetRoles        []string `json:"targetRoles"`
	PreferredLocations []string `json:"preferredLocations"`
	Volunteering       string   `json:"volunteering"`
	Publications       string   `json:"publications"`
	Licenses           string   `json:"licenses"`
}

type WorkExperienceDTO struct {
	Company        string   `json:"company" binding:"required"`
	JobTitle       string   `json:"jobTitle" binding:"required"`
	EmploymentType string   `json:"employmentType"`
	Location       string   `json:"location"`
	StartDate      string   `json:"startDate" binding:"required"`
	EndDate        string   `json:"endDate"`
	IsCurrentJob   bool     `json:"isCurrentJob"`
	Description    string   `json:"description"`
	SkillsUsed     []string `json:"skillsUsed"`
	Achievements   string   `json:"achievements"`
}

type EducationDTO struct {
	Institution  string `json:"institution" binding:"required"`
	Degree       string `json:"degree" binding:"required"`
	FieldOfStudy string `json:"fieldOfStudy"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
	Grade        string `json:"grade"`
	Description  string `json:"description"`
}

type ProfileReportDTO struct {
	Reason      string `json:"reason" binding:"required"`
	Description string `json:"description"`
}

type AdminVerificationDTO struct {
	Status string `json:"status" binding:"required"` // verified, rejected, pending, unverified
	Notes  string `json:"notes"`
}

type AdminRestrictionDTO struct {
	IsRestricted bool   `json:"isRestricted"`
	Reason       string `json:"reason"`
}

type ProfileCompletenessDTO struct {
	Percentage        int      `json:"percentage"`
	MissingSections   []string `json:"missingSections"`
	Recommendations   []string `json:"recommendations"`
	IsProfileComplete bool     `json:"isProfileComplete"`
}

type VerificationRequestPayload struct {
	DocumentType string `json:"documentType" binding:"required"`
	DocumentURL  string `json:"documentUrl" binding:"required"`
	Notes        string `json:"notes"`
}

type CareerPreferencesDTO struct {
	AvailabilityStatus string   `json:"availabilityStatus"`
	OpenToWork         bool     `json:"openToWork"`
	OpenToRecruiters   bool     `json:"openToRecruiters"`
	TargetRoles        []string `json:"targetRoles"`
	PreferredLocations []string `json:"preferredLocations"`
	PreferredWorkModes []string `json:"preferredWorkModes"`
}

type ProfilePrivacyDTO struct {
	ProfileVisibility string `json:"profileVisibility"` // public, connections_only, private
	SearchVisible     bool   `json:"searchVisible"`
	ShowContactInfo   bool   `json:"showContactInfo"`
}

type ProfileAnalyticsDTO struct {
	ProfileViews       int `json:"profileViews"`
	SearchAppearances  int `json:"searchAppearances"`
	ConnectionRequests int `json:"connectionRequests"`
}

type ResumeConsistencyDTO struct {
	Score              int      `json:"score"`
	MissingSkills      []string `json:"missingSkills"`
	TitleDiscrepancies []string `json:"titleDiscrepancies"`
	IsConsistent       bool     `json:"isConsistent"`
}

