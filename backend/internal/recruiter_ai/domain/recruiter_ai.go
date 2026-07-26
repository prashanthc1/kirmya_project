package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	SessionTypeRanking      = "candidate_ranking"
	SessionTypeJDOptimize   = "jd_optimization"
	SessionTypeInterview    = "interview_prep"
	SessionTypeOutreachDraft = "outreach_draft"
)

type RecruiterAISession struct {
	ID          uuid.UUID   `json:"id"`
	OrgID       uuid.UUID   `json:"org_id"`
	RecruiterID uuid.UUID   `json:"recruiter_id"`
	JobID       uuid.UUID   `json:"job_id"`
	SessionType string      `json:"session_type"`
	CreatedAt   time.Time   `json:"created_at"`
}

type AICandidateScore struct {
	ID             uuid.UUID `json:"id"`
	SessionID      uuid.UUID `json:"session_id"`
	CandidateID    uuid.UUID `json:"candidate_id"`
	CandidateName  string    `json:"candidate_name"`
	JobTitle       string    `json:"job_title"`
	RankPosition   int       `json:"rank_position"`
	FitScore       int       `json:"fit_score"` // 0 to 100
	Strengths      []string  `json:"strengths"`
	RedFlags       []string  `json:"red_flags"`
	MatchRationale string    `json:"match_rationale"`
	CreatedAt      time.Time `json:"created_at"`
}

type AIGeneratedContent struct {
	ID            uuid.UUID              `json:"id"`
	SessionID     uuid.UUID              `json:"session_id"`
	ContentType   string                 `json:"content_type"`
	GeneratedText string                 `json:"generated_text"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt     time.Time              `json:"created_at"`
}

type RankCandidatesPayload struct {
	JobID uuid.UUID `json:"job_id" binding:"required"`
}

type GenerateQuestionsPayload struct {
	CandidateID uuid.UUID `json:"candidate_id" binding:"required"`
	JobID       uuid.UUID `json:"job_id" binding:"required"`
}

type OptimizeJDPayload struct {
	JobID          uuid.UUID `json:"job_id"`
	RawDescription string    `json:"raw_description" binding:"required"`
}

type OutreachEmailPayload struct {
	CandidateID uuid.UUID `json:"candidate_id" binding:"required"`
	JobID       uuid.UUID `json:"job_id" binding:"required"`
	Tone        string    `json:"tone"` // 'professional', 'warm', 'executive'
}
