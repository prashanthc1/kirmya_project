package models

import (
	"time"

	"github.com/google/uuid"
)

// AIPreference defines user preference settings.
type AIPreference struct {
	UserID           uuid.UUID `json:"userId"`
	SelectedProvider string    `json:"selectedProvider"`
	Temperature      float64   `json:"temperature"`
	MaxTokens        int       `json:"maxTokens"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// AIRequest logs metadata about an invocation.
type AIRequest struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"userId"`
	Feature          string    `json:"feature"`
	Provider         string    `json:"provider"`
	PromptTokens     int       `json:"promptTokens"`
	CompletionTokens int       `json:"completionTokens"`
	CreatedAt        time.Time `json:"createdAt"`
}

// AIResult records raw and structured responses.
type AIResult struct {
	ID             uuid.UUID              `json:"id"`
	RequestID      uuid.UUID              `json:"requestId"`
	RawInput       string                 `json:"rawInput"`
	RawOutput      string                 `json:"rawOutput"`
	ParsedResponse map[string]interface{} `json:"parsedResponse"`
	CreatedAt      time.Time              `json:"createdAt"`
}

// DTO Payloads
type ResumeAnalysisRequest struct {
	ResumeText string `json:"resumeText" binding:"required"`
}

type SkillGapRequest struct {
	UserSkills []string `json:"userSkills" binding:"required"`
	TargetRole string   `json:"targetRole" binding:"required"`
}

type JobMatchingRequest struct {
	ResumeText     string `json:"resumeText" binding:"required"`
	JobDescription string `json:"jobDescription" binding:"required"`
}

type InterviewPrepRequest struct {
	TargetRole      string `json:"targetRole" binding:"required"`
	ExperienceLevel string `json:"experienceLevel" binding:"required"`
}

type CareerSuggestionsRequest struct {
	Interests []string `json:"interests" binding:"required"`
	Skills    []string `json:"skills" binding:"required"`
}
