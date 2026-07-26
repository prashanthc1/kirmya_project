package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	ModeCareerChat        = "career_chat"
	ModeInterviewCoaching = "interview_coaching"
	ModeRoadmapGen        = "roadmap_gen"

	SenderUser      = "user"
	SenderAssistant = "assistant"
)

type AIConversation struct {
	ID        uuid.UUID   `json:"id"`
	UserID    uuid.UUID   `json:"user_id"`
	Title     string      `json:"title"`
	Mode      string      `json:"mode"`
	Status    string      `json:"status"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
	Messages  []AIMessage `json:"messages,omitempty"`
}

type AIMessage struct {
	ID             uuid.UUID `json:"id"`
	ConversationID uuid.UUID `json:"conversation_id"`
	Sender         string    `json:"sender"`
	Content        string    `json:"content"`
	TokensUsed     int       `json:"tokens_used"`
	CreatedAt      time.Time `json:"created_at"`
}

type CareerMilestone struct {
	StepNumber  int      `json:"step_number"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Duration    string   `json:"duration"`
	KeySkills   []string `json:"key_skills"`
	Status      string   `json:"status"` // 'pending', 'in_progress', 'completed'
}

type CareerPlan struct {
	ID                 uuid.UUID         `json:"id"`
	UserID             uuid.UUID         `json:"user_id"`
	TargetRole         string            `json:"target_role"`
	TargetSalary       string            `json:"target_salary"`
	CurrentLevel       string            `json:"current_level"`
	Milestones         []CareerMilestone `json:"milestones"`
	ProgressPercentage int               `json:"progress_percentage"`
	CreatedAt          time.Time         `json:"created_at"`
	UpdatedAt          time.Time         `json:"updated_at"`
}

type AIUserContext struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"user_id"`
	CareerGoals       []string  `json:"career_goals"`
	SkillGaps         []string  `json:"skill_gaps"`
	PreferredIndustry string    `json:"preferred_industry"`
	MemorySummary     string    `json:"memory_summary"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type CreateConversationPayload struct {
	Title string `json:"title"`
	Mode  string `json:"mode"`
}

type SendMessagePayload struct {
	Content string `json:"content" binding:"required"`
}

type GenerateRoadmapPayload struct {
	TargetRole   string `json:"target_role" binding:"required"`
	CurrentLevel string `json:"current_level"`
	TargetSalary string `json:"target_salary"`
}
