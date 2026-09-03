package models

import (
	"time"

	"github.com/google/uuid"
)

// CoverLetter represents a cover letter document metadata & content.
type CoverLetter struct {
	ID                 uuid.UUID            `json:"id"`
	UserID             uuid.UUID            `json:"userId"`
	Name               string               `json:"name"`
	JobID              *uuid.UUID           `json:"jobId,omitempty"`
	CompanyName        string               `json:"companyName"`
	JobTitle           string               `json:"jobTitle"`
	RecipientName      string               `json:"recipientName"`
	RecipientTitle     string               `json:"recipientTitle"`
	JobReferenceNumber string               `json:"jobReferenceNumber"`
	Location           string               `json:"location"`
	Date               string               `json:"date"`
	OpeningGreeting    string               `json:"openingGreeting"`
	Introduction       string               `json:"introduction"`
	Body               string               `json:"body"`
	Closing            string               `json:"closing"`
	Signature          string               `json:"signature"`
	FullContent        string               `json:"fullContent"`
	TemplateName       string               `json:"templateName"` // modern, minimal, professional, executive, technical, ats
	Tone               string               `json:"tone"`         // Professional, Confident, Executive, Friendly, Concise, Enthusiastic, Technical
	TargetLength       string               `json:"targetLength"` // Short, Standard, Detailed
	IsAiGenerated      bool                 `json:"isAiGenerated"`
	IsJobSpecific      bool                 `json:"isJobSpecific"`
	WordCount          int                  `json:"wordCount"`
	CharacterCount     int                  `json:"characterCount"`
	JobMatchScore      int                  `json:"jobMatchScore"`
	CreatedAt          time.Time            `json:"createdAt"`
	UpdatedAt          time.Time            `json:"updatedAt"`
	Sections           []CoverLetterSection `json:"sections,omitempty"`
}

// CoverLetterSection detail.
type CoverLetterSection struct {
	ID            uuid.UUID `json:"id"`
	CoverLetterID uuid.UUID `json:"coverLetterId"`
	SectionType   string    `json:"sectionType"` // header, greeting, introduction, body, achievements, closing, signature
	Content       string    `json:"content"`
	SortOrder     int       `json:"sortOrder"`
}

// CoverLetterVersion snapshot.
type CoverLetterVersion struct {
	ID              uuid.UUID `json:"id"`
	CoverLetterID   uuid.UUID `json:"coverLetterId"`
	VersionTag      string    `json:"versionTag"`
	ContentSnapshot string    `json:"contentSnapshot"`
	WordCount       int       `json:"wordCount"`
	CreatedBy       string    `json:"createdBy"`
	CreatedAt       time.Time `json:"createdAt"`
}

// CoverLetterTemplate metadata.
type CoverLetterTemplate struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Category       string    `json:"category"`
	Description    string    `json:"description"`
	RecommendedUse string    `json:"recommendedUse"`
	ThumbnailURL   string    `json:"thumbnailUrl"`
	CreatedAt      time.Time `json:"createdAt"`
}

// CoverLetterShare metadata.
type CoverLetterShare struct {
	ID            uuid.UUID `json:"id"`
	CoverLetterID uuid.UUID `json:"coverLetterId"`
	UserID        uuid.UUID `json:"userId"`
	ShareToken    string    `json:"shareToken"`
	PrivacyLevel  string    `json:"privacyLevel"`
	ShareURL      string    `json:"shareUrl"`
	QRCodeURL     string    `json:"qrCodeUrl"`
	IsActive      bool      `json:"isActive"`
	CreatedAt     time.Time `json:"createdAt"`
}

// CoverLetterAnalytics metadata.
type CoverLetterAnalytics struct {
	CoverLetterID         uuid.UUID `json:"coverLetterId"`
	UserID                uuid.UUID `json:"userId"`
	TotalViews            int       `json:"totalViews"`
	RecruiterViews        int       `json:"recruiterViews"`
	TotalDownloads        int       `json:"totalDownloads"`
	ApplicationsUsedCount int       `json:"applicationsUsedCount"`
	AvgMatchScore         float64   `json:"avgMatchScore"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// GenerateCoverLetterRequest payload.
type GenerateCoverLetterRequest struct {
	JobID          *uuid.UUID `json:"jobId,omitempty"`
	JobTitle       string     `json:"jobTitle"`
	CompanyName    string     `json:"companyName"`
	JobDescription string     `json:"jobDescription"`
	Tone           string     `json:"tone"`
	Length         string     `json:"length"`
}

// RewriteRequest payload.
type RewriteRequest struct {
	Content      string `json:"content"`
	Instruction  string `json:"instruction"`
	Tone         string `json:"tone"`
	TargetLength string `json:"targetLength"`
}

// TailorJobResponse payload.
type TailorJobResponse struct {
	MatchScore               int      `json:"matchScore"`
	RelevantSkills           []string `json:"relevantSkills"`
	RelevantExperience       []string `json:"relevantExperience"`
	RelevantAchievements     []string `json:"relevantAchievements"`
	RecommendedTalkingPoints []string `json:"recommendedTalkingPoints"`
	SuggestedCoverLetterID   *uuid.UUID `json:"suggestedCoverLetterId,omitempty"`
}

// CreateCoverLetterPayload represents creation request.
type CreateCoverLetterPayload struct {
	Name         string `json:"name"`
	TemplateName string `json:"templateName"`
}

// UpdateCoverLetterPayload represents cover letter update request.
type UpdateCoverLetterPayload struct {
	Name            string `json:"name,omitempty"`
	TemplateName    string `json:"templateName,omitempty"`
	OpeningGreeting string `json:"openingGreeting,omitempty"`
	Introduction    string `json:"introduction,omitempty"`
	Body            string `json:"body,omitempty"`
	Closing         string `json:"closing,omitempty"`
	Signature       string `json:"signature,omitempty"`
	FullContent     string `json:"fullContent,omitempty"`
	Tone            string `json:"tone,omitempty"`
}

// ShareCoverLetterPayload represents share creation request.
type ShareCoverLetterPayload struct {
	PrivacyLevel string `json:"privacyLevel"`
}

// TailorCoverLetterPayload represents tailoring request.
type TailorCoverLetterPayload struct {
	JobDescription string `json:"jobDescription"`
}

// CreateVersionPayload represents version snapshot request.
type CreateVersionPayload struct {
	VersionTag string `json:"versionTag"`
}

