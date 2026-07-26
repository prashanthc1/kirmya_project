package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	RecStatusPending  = "pending_approval"
	RecStatusAccepted = "accepted"
	RecStatusHidden   = "hidden"
	RecStatusFlagged  = "flagged"
)

type SkillEndorsement struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"user_id"`
	EndorserID        uuid.UUID `json:"endorser_id"`
	SkillName         string    `json:"skill_name"`
	EndorserName      string    `json:"endorser_name"`
	EndorserTitle     string    `json:"endorser_title"`
	EndorserAvatarURL string    `json:"endorser_avatar_url"`
	CreatedAt         time.Time `json:"created_at"`
}

type SkillEndorsementGroup struct {
	SkillName        string             `json:"skill_name"`
	EndorsementCount int                `json:"endorsement_count"`
	Endorsers        []SkillEndorsement `json:"endorsers"`
}

type ProfessionalRecommendation struct {
	ID              uuid.UUID `json:"id"`
	RecipientID     uuid.UUID `json:"recipient_id"`
	AuthorID        uuid.UUID `json:"author_id"`
	AuthorName      string    `json:"author_name"`
	AuthorTitle     string    `json:"author_title"`
	AuthorAvatarURL string    `json:"author_avatar_url"`
	Relationship    string    `json:"relationship"`
	ContentText     string    `json:"content_text"`
	Status          string    `json:"status"`
	IsFlagged       bool      `json:"is_flagged"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type ProfessionalReference struct {
	ID            uuid.UUID `json:"id"`
	CandidateID   uuid.UUID `json:"candidate_id"`
	RefereeName   string    `json:"referee_name"`
	RefereeTitle  string    `json:"referee_title"`
	CompanyName   string    `json:"company_name"`
	RefereeEmail  string    `json:"referee_email"`
	RefereePhone  string    `json:"referee_phone"`
	Relationship  string    `json:"relationship"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type EndorseSkillPayload struct {
	UserID            string `json:"user_id" binding:"required"`
	SkillName         string `json:"skill_name" binding:"required"`
	EndorserName      string `json:"endorser_name"`
	EndorserTitle     string `json:"endorser_title"`
	EndorserAvatarURL string `json:"endorser_avatar_url"`
}

type SubmitRecommendationPayload struct {
	RecipientID     string `json:"recipient_id" binding:"required"`
	AuthorName      string `json:"author_name"`
	AuthorTitle     string `json:"author_title"`
	AuthorAvatarURL string `json:"author_avatar_url"`
	Relationship    string `json:"relationship" binding:"required"`
	ContentText     string `json:"content_text" binding:"required"`
}

type UpdateRecommendationStatusPayload struct {
	Status    string `json:"status" binding:"required"` // 'accepted', 'hidden', 'flagged'
	IsFlagged bool   `json:"is_flagged"`
}

type CreateReferencePayload struct {
	RefereeName  string `json:"referee_name" binding:"required"`
	RefereeTitle string `json:"referee_title" binding:"required"`
	CompanyName  string `json:"company_name" binding:"required"`
	RefereeEmail string `json:"referee_email" binding:"required"`
	RefereePhone string `json:"referee_phone"`
	Relationship string `json:"relationship" binding:"required"`
}
