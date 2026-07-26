package models

import (
	"time"

	"github.com/google/uuid"
)

// Resume represents a master resume document metadata.
type Resume struct {
	ID            uuid.UUID       `json:"id"`
	UserID        uuid.UUID       `json:"userId"`
	Title         string          `json:"title"`
	TemplateName  string          `json:"templateName"` // classic, modern, minimal
	IsDefault     bool            `json:"isDefault"`
	AtsScore      int             `json:"atsScore"`
	AiSuggestions string          `json:"aiSuggestions"` // Serialized JSON suggestions
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
	Sections      []ResumeSection `json:"sections,omitempty"`
}

// ResumeSection holds specific data fields for a section type.
type ResumeSection struct {
	ID          uuid.UUID `json:"id"`
	ResumeID    uuid.UUID `json:"resumeId"`
	SectionType string    `json:"sectionType"` // personal_info, summary, experience, education, skills, certs, projects, achievements, languages
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
