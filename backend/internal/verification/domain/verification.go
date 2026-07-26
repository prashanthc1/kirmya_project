package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	TypeEmail         = "email"
	TypeEmployment    = "employment"
	TypeSkill         = "skill"
	TypeCertification = "certification"

	StatusPending  = "pending"
	StatusInReview = "in_review"
	StatusVerified = "verified"
	StatusRejected = "rejected"

	PrivacyPublic         = "public"
	PrivacyRecruitersOnly = "recruiters_only"
	PrivacyPrivate        = "private"
)

type VerificationDocument struct {
	ID           uuid.UUID `json:"id"`
	RequestID    uuid.UUID `json:"request_id"`
	UserID       uuid.UUID `json:"user_id"`
	DocumentType string    `json:"document_type"`
	FileName     string    `json:"file_name"`
	FileURL      string    `json:"file_url"`
	IsSensitive  bool      `json:"is_sensitive"`
	CreatedAt    time.Time `json:"created_at"`
}

type VerificationRequest struct {
	ID               uuid.UUID              `json:"id"`
	UserID           uuid.UUID              `json:"user_id"`
	VerificationType string                 `json:"verification_type"`
	Title            string                 `json:"title"`
	OrganizationName string                 `json:"organization_name"`
	CredentialID     string                 `json:"credential_id"`
	VerificationURL  string                 `json:"verification_url"`
	WorkEmail        string                 `json:"work_email"`
	Status           string                 `json:"status"`
	ReviewerNotes    string                 `json:"reviewer_notes"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
	Documents        []VerificationDocument `json:"documents,omitempty"`
}

type VerificationStatus struct {
	ID                     uuid.UUID `json:"id"`
	UserID                 uuid.UUID `json:"user_id"`
	TrustScore             int       `json:"trust_score"`
	BadgeLevel             string    `json:"badge_level"`
	EmailVerified          bool      `json:"email_verified"`
	EmploymentVerified     bool      `json:"employment_verified"`
	SkillsVerified         bool      `json:"skills_verified"`
	CertificationsVerified bool      `json:"certifications_verified"`
	PrivacySetting         string    `json:"privacy_setting"`
	HideSensitiveDocs      bool      `json:"hide_sensitive_docs"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

type CreateVerificationRequestPayload struct {
	VerificationType string `json:"verification_type" binding:"required"`
	Title            string `json:"title" binding:"required"`
	OrganizationName string `json:"organization_name"`
	CredentialID     string `json:"credential_id"`
	VerificationURL  string `json:"verification_url"`
	WorkEmail        string `json:"work_email"`
}

type UpdatePrivacyPayload struct {
	PrivacySetting    string `json:"privacy_setting" binding:"required"`
	HideSensitiveDocs bool   `json:"hide_sensitive_docs"`
}
