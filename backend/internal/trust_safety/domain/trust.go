package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	TargetTypeUser    = "user"
	TargetTypeCompany = "company"
	TargetTypeJob     = "job"

	ReportStatusPending   = "pending"
	ReportStatusResolved  = "resolved"
	ReportStatusDismissed = "dismissed"

	ActionWarn    = "warn"
	ActionBlock   = "block"
	ActionSuspend = "suspend"
	ActionRemove  = "remove"

	BadgeIdentityVerified   = "identity_verified"
	BadgeEmploymentVerified = "employment_verified"
	BadgeCompanyVerified    = "company_verified"
)

type Report struct {
	ID         uuid.UUID `json:"id"`
	ReporterID uuid.UUID `json:"reporter_id"`
	TargetType string    `json:"target_type"`
	TargetID   uuid.UUID `json:"target_id"`
	TargetName string    `json:"target_name"`
	Category   string    `json:"category"` // 'spam', 'fraud', 'harassment', 'fake_job'
	Reason     string    `json:"reason"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type ModerationAction struct {
	ID          uuid.UUID `json:"id"`
	ModeratorID uuid.UUID `json:"moderator_id"`
	TargetID    uuid.UUID `json:"target_id"`
	TargetType  string    `json:"target_type"`
	Action      string    `json:"action"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
}

type VerificationBadge struct {
	ID         uuid.UUID `json:"id"`
	EntityID   uuid.UUID `json:"entity_id"`
	EntityType string    `json:"entity_type"`
	BadgeType  string    `json:"badge_type"`
	IssuedAt   time.Time `json:"issued_at"`
}

type FraudLog struct {
	ID          uuid.UUID `json:"id"`
	EntityType  string    `json:"entity_type"`
	EntityID    uuid.UUID `json:"entity_id"`
	EntityTitle string    `json:"entity_title"`
	FraudScore  float64   `json:"fraud_score"`
	Triggers    []string  `json:"triggers"`
	ActionTaken string    `json:"action_taken"`
	CreatedAt   time.Time `json:"created_at"`
}

type SubmitReportPayload struct {
	TargetType string    `json:"target_type" binding:"required"`
	TargetID   uuid.UUID `json:"target_id" binding:"required"`
	Category   string    `json:"category" binding:"required"`
	Reason     string    `json:"reason" binding:"required"`
}

type ModerationActionPayload struct {
	Action string `json:"action" binding:"required"`
	Notes  string `json:"notes"`
}
