package domain

import (
	"time"

	"github.com/google/uuid"
)

// Session Types
const (
	SessionCareerRec = "career_recommendations"
	SessionResume    = "resume_critique"
	SessionSkillGap  = "skill_gap"
	SessionJobGuide  = "job_guidance"
	SessionInterview = "interview_prep"
)

type UserContext struct {
	CurrentRole    string   `json:"current_role"`
	TargetRole     string   `json:"target_role"`
	YearsExp       int      `json:"years_exp"`
	CurrentSkills  []string `json:"current_skills"`
	TargetSkills   []string `json:"target_skills"`
	JobLossContext string   `json:"job_loss_context,omitempty"` // e.g., 'recent layoff', 'seeking career transition'
	ResumeSnippet  string   `json:"resume_snippet,omitempty"`
}

type CareerSession struct {
	ID                  uuid.UUID          `json:"id"`
	UserID              uuid.UUID          `json:"user_id"`
	SessionType         string             `json:"session_type"`
	Title               string             `json:"title"`
	ActiveTopic         string             `json:"active_topic"`
	UserContextSnapshot UserContext        `json:"user_context_snapshot"`
	Status              string             `json:"status"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
	Recommendations     []AIRecommendation `json:"recommendations,omitempty"`
}

type AIRecommendation struct {
	ID            uuid.UUID `json:"id"`
	SessionID     uuid.UUID `json:"session_id"`
	UserID        uuid.UUID `json:"user_id"`
	Category      string    `json:"category"`
	Title         string    `json:"title"`
	ContentText   string    `json:"content_text"`
	PriorityScore int       `json:"priority_score"`
	ActionItems   []string  `json:"action_items"`
	Bookmarked    bool      `json:"bookmarked"`
	CreatedAt     time.Time `json:"created_at"`
}

type AIUsageLog struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"user_id"`
	SessionID        *uuid.UUID `json:"session_id,omitempty"`
	ProviderName     string    `json:"provider_name"`
	ModelName        string    `json:"model_name"`
	RequestType      string    `json:"request_type"`
	PromptTokens     int       `json:"prompt_tokens"`
	CompletionTokens int       `json:"completion_tokens"`
	TotalTokens      int       `json:"total_tokens"`
	LatencyMS        int       `json:"latency_ms"`
	CreatedAt        time.Time `json:"created_at"`
}

type GenerateCareerRequest struct {
	UserContext UserContext `json:"user_context" binding:"required"`
	Topic       string      `json:"topic"`
}

type ResumeCritiqueRequest struct {
	ResumeText string `json:"resume_text" binding:"required"`
	TargetRole string `json:"target_role"`
}

type SkillGapRequest struct {
	CurrentSkills []string `json:"current_skills" binding:"required"`
	TargetRole    string   `json:"target_role" binding:"required"`
}

type JobGuidanceRequest struct {
	TargetRole string `json:"target_role" binding:"required"`
	Location   string `json:"location"`
}

type InterviewPrepRequest struct {
	TargetRole string `json:"target_role" binding:"required"`
	FocusArea  string `json:"focus_area"` // e.g., 'technical', 'behavioral', 'system_design'
}
