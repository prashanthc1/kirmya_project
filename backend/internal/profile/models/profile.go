package models

import (
	"time"

	"github.com/google/uuid"
)

// UserProfile represents the header and meta-data details of a user CV profile.
type UserProfile struct {
	ID                         uuid.UUID            `json:"id"`
	UserID                     uuid.UUID            `json:"userId"`
	Headline                   string               `json:"headline"`
	Summary                    string               `json:"summary"`
	AvailabilityStatus         string               `json:"availabilityStatus"` // open_to_work, available_for_freelance, looking_for_networking, hiring
	ProfileCompletedPercentage int                  `json:"profileCompletedPercentage"`
	Volunteering               string               `json:"volunteering"`
	Publications               string               `json:"publications"`
	Licenses                   string               `json:"licenses"`
	CreatedAt                  time.Time            `json:"createdAt"`
	UpdatedAt                  time.Time            `json:"updatedAt"`
	Skills                     []UserSkill          `json:"skills,omitempty"`
	Certifications             []UserCertification  `json:"certifications,omitempty"`
	Projects                   []UserProject        `json:"projects,omitempty"`
	Languages                  []UserLanguage       `json:"languages,omitempty"`
	Achievements               []UserAchievement    `json:"achievements,omitempty"`
}

// UserSkill represents a specific technical or professional capability.
type UserSkill struct {
	ID               uuid.UUID `json:"id"`
	ProfileID        uuid.UUID `json:"profileId"`
	Name             string    `json:"name"`
	ProficiencyLevel string    `json:"proficiencyLevel"` // Beginner, Intermediate, Expert
}

// UserCertification represents a validated certification badge or license.
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

// UserProject represents a portfolio project item.
type UserProject struct {
	ID          uuid.UUID  `json:"id"`
	ProfileID   uuid.UUID  `json:"profileId"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	URL         string     `json:"url"`
	StartDate   *time.Time `json:"startDate"`
	EndDate     *time.Time `json:"endDate"`
}

// UserLanguage represents languages spoken by the candidate.
type UserLanguage struct {
	ID          uuid.UUID `json:"id"`
	ProfileID   uuid.UUID `json:"profileId"`
	Name        string    `json:"name"`
	Proficiency string    `json:"proficiency"` // Native, Bilingual, Professional
}

// UserAchievement represents awards, patents, and general professional milestones.
type UserAchievement struct {
	ID           uuid.UUID  `json:"id"`
	ProfileID    uuid.UUID  `json:"profileId"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	DateAchieved *time.Time `json:"dateAchieved"`
}

// UserPreference represents public visibility settings.
type UserPreference struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"userId"`
	ProfileVisibility string    `json:"profileVisibility"` // public, connections_only, private
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}
