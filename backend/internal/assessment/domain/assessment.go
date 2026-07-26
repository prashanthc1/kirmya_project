package domain

import (
	"time"

	"github.com/google/uuid"
)

// Question Types
const (
	TypeMCQ       = "mcq"
	TypePractical = "practical"
)

// Badge Tiers
const (
	TierBronze   = "Bronze"
	TierSilver   = "Silver"
	TierGold     = "Gold"
	TierPlatinum = "Platinum"
)

type Assessment struct {
	ID              uuid.UUID  `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Category        string     `json:"category"`
	DifficultyLevel string     `json:"difficulty_level"`
	DurationMinutes int        `json:"duration_minutes"`
	PassingScore    int        `json:"passing_score"`
	TotalQuestions  int        `json:"total_questions"`
	BadgeTitle      string     `json:"badge_title"`
	BadgeTier       string     `json:"badge_tier"`
	CreatedAt       time.Time  `json:"created_at"`
	Questions       []Question `json:"questions,omitempty"`
}

type Question struct {
	ID                 uuid.UUID `json:"id"`
	AssessmentID       uuid.UUID `json:"assessment_id"`
	QuestionType       string    `json:"question_type"`
	QuestionText       string    `json:"question_text"`
	Options            []string  `json:"options,omitempty"`
	CorrectOptionIndex *int      `json:"-"` // Omit correct answer key in public JSON responses!
	PracticalRubric    string    `json:"practical_rubric,omitempty"`
	MaxPoints          int       `json:"max_points"`
	QuestionOrder      int       `json:"question_order"`
	CreatedAt          time.Time `json:"created_at"`
}

type UserAnswerSubmission struct {
	QuestionID       uuid.UUID `json:"question_id"`
	SelectedOption   *int      `json:"selected_option,omitempty"`
	PracticalResponse string   `json:"practical_response,omitempty"`
}

type SubmitTestRequest struct {
	TimeTakenSeconds int                    `json:"time_taken_seconds"`
	Answers          []UserAnswerSubmission `json:"answers"`
}

type UserAssessmentResult struct {
	ID                 uuid.UUID   `json:"id"`
	UserID             uuid.UUID   `json:"user_id"`
	UserName           string      `json:"user_name"`
	AssessmentID       uuid.UUID   `json:"assessment_id"`
	AssessmentTitle    string      `json:"assessment_title"`
	ScorePercentage    int         `json:"score_percentage"`
	MCQScore           int         `json:"mcq_score"`
	PracticalAIScore   int         `json:"practical_ai_score"`
	PercentileRank     int         `json:"percentile_rank"`
	Passed             bool        `json:"passed"`
	TimeTakenSeconds   int         `json:"time_taken_seconds"`
	AIFeedbackSummary  string      `json:"ai_feedback_summary"`
	EarnedBadge        *SkillBadge `json:"earned_badge,omitempty"`
	CompletedAt        time.Time   `json:"completed_at"`
}

type SkillBadge struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"user_id"`
	UserName         string    `json:"user_name"`
	AssessmentID     uuid.UUID `json:"assessment_id"`
	BadgeTitle       string    `json:"badge_title"`
	Tier             string    `json:"tier"`
	VerificationCode string    `json:"verification_code"`
	SkillsValidated  []string  `json:"skills_validated"`
	IconName         string    `json:"icon_name"`
	IssuedAt         time.Time `json:"issued_at"`
}
