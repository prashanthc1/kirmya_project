package models

import (
	"time"

	"github.com/google/uuid"
)

// Resume represents a master resume document metadata.
type Resume struct {
	ID                   uuid.UUID       `json:"id"`
	UserID               uuid.UUID       `json:"userId"`
	Title                string          `json:"title"`
	TemplateName         string          `json:"templateName"` // classic, modern, minimal, executive, technical, creative
	IsDefault            bool            `json:"isDefault"`
	AtsScore             int             `json:"atsScore"`
	CompletionPercentage int             `json:"completionPercentage"`
	ViewCount            int             `json:"viewCount"`
	DownloadCount        int             `json:"downloadCount"`
	ApplicationCount     int             `json:"applicationCount"`
	FontFamily           string          `json:"fontFamily"`
	FontSize             string          `json:"fontSize"`
	LineSpacing          string          `json:"lineSpacing"`
	PageMargins          string          `json:"pageMargins"`
	PaperSize            string          `json:"paperSize"`
	PrimaryColor         string          `json:"primaryColor"`
	AiSuggestions        string          `json:"aiSuggestions"` // Serialized JSON suggestions
	CreatedAt            time.Time       `json:"createdAt"`
	UpdatedAt            time.Time       `json:"updatedAt"`
	Sections             []ResumeSection `json:"sections,omitempty"`
}

// ResumeSection holds specific data fields for a section type.
type ResumeSection struct {
	ID          uuid.UUID `json:"id"`
	ResumeID    uuid.UUID `json:"resumeId"`
	SectionType string    `json:"sectionType"` // personal_info, summary, experience, education, skills, certs, projects, achievements, languages, custom
	Content     string    `json:"content"`     // JSON raw string representation of content fields
	SortOrder   int       `json:"sortOrder"`
}

// ResumeVersion stores historical save checkpoints.
type ResumeVersion struct {
	ID              uuid.UUID `json:"id"`
	ResumeID        uuid.UUID `json:"resumeId"`
	VersionTag      string    `json:"versionTag"`
	ContentSnapshot string    `json:"contentSnapshot"` // Full JSON snapshot of the resume + sections
	AtsScore        int       `json:"atsScore"`
	AiSuggestions   string    `json:"aiSuggestions"`
	CreatedAt       time.Time `json:"createdAt"`
}

// ResumeTemplate metadata.
type ResumeTemplate struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Category         string    `json:"category"`
	Description      string    `json:"description"`
	RecommendedFor   string    `json:"recommendedFor"`
	AtsCompatibility int       `json:"atsCompatibility"`
	ThumbnailURL     string    `json:"thumbnailUrl"`
	CreatedAt        time.Time `json:"createdAt"`
}

// ResumeShare metadata.
type ResumeShare struct {
	ID           uuid.UUID `json:"id"`
	ResumeID     uuid.UUID `json:"resumeId"`
	UserID       uuid.UUID `json:"userId"`
	ShareToken   string    `json:"shareToken"`
	PrivacyLevel string    `json:"privacyLevel"`
	ShareURL     string    `json:"shareUrl"`
	QRCodeURL    string    `json:"qrCodeUrl"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
}

// ResumeAnalytics metadata.
type ResumeAnalytics struct {
	ResumeID              uuid.UUID `json:"resumeId"`
	UserID                uuid.UUID `json:"userId"`
	TotalViews            int       `json:"totalViews"`
	RecruiterViews        int       `json:"recruiterViews"`
	TotalDownloads        int       `json:"totalDownloads"`
	ApplicationsUsedCount int       `json:"applicationsUsedCount"`
	AvgMatchScore         float64   `json:"avgMatchScore"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// ATSAnalysis payload.
type ATSAnalysis struct {
	OverallScore    int      `json:"overallScore"`
	KeywordScore    int      `json:"keywordScore"`
	ExperienceScore int      `json:"experienceScore"`
	FormattingScore int      `json:"formattingScore"`
	SkillsScore     int      `json:"skillsScore"`
	ParsingIssues   []string `json:"parsingIssues"`
	Recommendations []string `json:"recommendations"`
}

// TailorJobRequest.
type TailorJobRequest struct {
	JobID          uuid.UUID `json:"jobId"`
	JobDescription string    `json:"jobDescription"`
}

// TailorJobResponse.
type TailorJobResponse struct {
	MatchScore         int      `json:"matchScore"`
	MissingKeywords    []string `json:"missingKeywords"`
	MissingSkills      []string `json:"missingSkills"`
	RecommendedChanges []string `json:"recommendedChanges"`
	TailoredResumeID   *uuid.UUID `json:"tailoredResumeId,omitempty"`
}

// ImportResumeRequest.
type ImportResumeRequest struct {
	FileName string `json:"fileName"`
	FileData string `json:"fileData"` // Base64 encoded or content text
	FileType string `json:"fileType"` // pdf, docx, txt
}
