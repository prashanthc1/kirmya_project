package models

import (
	"time"

	"github.com/google/uuid"
)

// UserBlock represents a user, recruiter, or company block record.
type UserBlock struct {
	ID          uuid.UUID `json:"id" db:"id"`
	BlockerID   uuid.UUID `json:"blocker_id" db:"blocker_id"`
	BlockedType string    `json:"blocked_type" db:"blocked_type"` // user, recruiter, company
	BlockedID   uuid.UUID `json:"blocked_id" db:"blocked_id"`
	Reason      string    `json:"reason,omitempty" db:"reason"`
	Scope       string    `json:"scope" db:"scope"` // all, messaging, networking
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// SafetyReport represents a user-submitted abuse or content report.
type SafetyReport struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	ReporterID      uuid.UUID  `json:"reporter_id" db:"reporter_id"`
	TargetType      string     `json:"target_type" db:"target_type"` // user, profile, job, company, recruiter, message, community, comment, resume, file, link, ai_content
	TargetID        uuid.UUID  `json:"target_id" db:"target_id"`
	TargetTitle     string     `json:"target_title,omitempty" db:"target_title"`
	Category        string     `json:"category" db:"category"` // spam, scam, fraud, fake_job, fake_recruiter, impersonation, harassment, threat, hate_abuse, privacy_violation, phishing, malicious_content, inappropriate_content, platform_abuse, copyright, other
	Description     string     `json:"description" db:"description"`
	EvidenceURLs    []string   `json:"evidence_urls,omitempty" db:"evidence_urls"`
	Status          string     `json:"status" db:"status"`     // submitted, received, under_review, needs_info, action_taken, no_violation, escalated, appealed, resolved, closed
	Priority        string     `json:"priority" db:"priority"` // low, normal, high, urgent, critical
	AssignedAdminID *uuid.UUID `json:"assigned_admin_id,omitempty" db:"assigned_admin_id"`
	ResolutionNotes string     `json:"resolution_notes,omitempty" db:"resolution_notes"`
	CompletedAt     *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// SafetyCase represents a centralized moderation investigation case.
type SafetyCase struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	CaseNumber       string     `json:"case_number" db:"case_number"`
	TargetType       string     `json:"target_type" db:"target_type"`
	TargetID         uuid.UUID  `json:"target_id" db:"target_id"`
	TargetTitle      string     `json:"target_title,omitempty" db:"target_title"`
	ReporterID       *uuid.UUID `json:"reporter_id,omitempty" db:"reporter_id"`
	Category         string     `json:"category" db:"category"`
	Priority         string     `json:"priority" db:"priority"`
	RiskScore        float64    `json:"risk_score" db:"risk_score"`
	Status           string     `json:"status" db:"status"` // new, queued, under_review, escalated, action_pending, resolved, appealed, closed
	AssignedAdminID  *uuid.UUID `json:"assigned_admin_id,omitempty" db:"assigned_admin_id"`
	AssignedTeam     string     `json:"assigned_team" db:"assigned_team"`
	AISummary        string     `json:"ai_summary,omitempty" db:"ai_summary"`
	AIRecommendation string     `json:"ai_recommendation,omitempty" db:"ai_recommendation"`
	AIConfidence     float64    `json:"ai_confidence" db:"ai_confidence"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// ModerationDecision represents an enforcement action taken by a moderator.
type ModerationDecision struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	CaseID           *uuid.UUID `json:"case_id,omitempty" db:"case_id"`
	ReportID         *uuid.UUID `json:"report_id,omitempty" db:"report_id"`
	AdminID          uuid.UUID  `json:"admin_id" db:"admin_id"`
	TargetType       string     `json:"target_type" db:"target_type"`
	TargetID         uuid.UUID  `json:"target_id" db:"target_id"`
	ActionType       string     `json:"action_type" db:"action_type"` // warning, content_removal, visibility_reduction, messaging_restriction, job_posting_restriction, application_restriction, community_restriction, temporary_suspension, permanent_suspension, account_lock, account_deactivation
	EnforcementLevel string     `json:"enforcement_level" db:"enforcement_level"`
	Reason           string     `json:"reason" db:"reason"`
	PolicyVersion    string     `json:"policy_version" db:"policy_version"`
	DurationDays     int        `json:"duration_days" db:"duration_days"`
	ExpiresAt        *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	IsActive         bool       `json:"is_active" db:"is_active"`
	AIAssisted       bool       `json:"ai_assisted" db:"ai_assisted"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
}

// UserRestriction represents active granular restrictions applied to a user.
type UserRestriction struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	UserID           uuid.UUID  `json:"user_id" db:"user_id"`
	RestrictionScope string     `json:"restriction_scope" db:"restriction_scope"` // messaging, job_posting, application, community, profile, recruiter_activity
	Reason           string     `json:"reason" db:"reason"`
	StartsAt         time.Time  `json:"starts_at" db:"starts_at"`
	ExpiresAt        *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedBy        *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	IsActive         bool       `json:"is_active" db:"is_active"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
}

// SafetyAppeal represents a user appeal submission against an enforcement decision.
type SafetyAppeal struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	DecisionID      uuid.UUID  `json:"decision_id" db:"decision_id"`
	UserID          uuid.UUID  `json:"user_id" db:"user_id"`
	Reason          string     `json:"reason" db:"reason"`
	Explanation     string     `json:"explanation" db:"explanation"`
	EvidenceURLs    []string   `json:"evidence_urls,omitempty" db:"evidence_urls"`
	Status          string     `json:"status" db:"status"` // submitted, under_review, needs_info, upheld, reversed, closed
	ReviewedBy      *uuid.UUID `json:"reviewed_by,omitempty" db:"reviewed_by"`
	ResolutionNotes string     `json:"resolution_notes,omitempty" db:"resolution_notes"`
	SubmittedAt     time.Time  `json:"submitted_at" db:"submitted_at"`
	ResolvedAt      *time.Time `json:"resolved_at,omitempty" db:"resolved_at"`
}

// ModeratorNote represents an internal audit note on a case or report.
type ModeratorNote struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	CaseID    *uuid.UUID `json:"case_id,omitempty" db:"case_id"`
	ReportID  *uuid.UUID `json:"report_id,omitempty" db:"report_id"`
	AdminID   uuid.UUID  `json:"admin_id" db:"admin_id"`
	Note      string     `json:"note" db:"note"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}
