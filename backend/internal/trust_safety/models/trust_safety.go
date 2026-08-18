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

// UserMute represents a user, community, conversation, or job mute.
type UserMute struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	MutedType string     `json:"muted_type" db:"muted_type"` // user, community, conversation, job
	MutedID   uuid.UUID  `json:"muted_id" db:"muted_id"`
	ExpiresAt *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// SafetyReport represents a user-submitted abuse or content report.
type SafetyReport struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	ReporterID      uuid.UUID  `json:"reporter_id,omitempty" db:"reporter_id"`
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

// ReportSubmitPayload payload for submitting a new abuse report.
type ReportSubmitPayload struct {
	TargetType   string   `json:"target_type" binding:"required"`
	TargetID     string   `json:"target_id" binding:"required"`
	TargetTitle  string   `json:"target_title"`
	Category     string   `json:"category" binding:"required"`
	Description  string   `json:"description" binding:"required"`
	EvidenceURLs []string `json:"evidence_urls"`
}

// BlockUserPayload payload for blocking a target.
type BlockUserPayload struct {
	BlockedType string `json:"blocked_type" binding:"required"`
	BlockedID   string `json:"blocked_id" binding:"required"`
	Reason      string `json:"reason"`
	Scope       string `json:"scope"`
}

// MuteUserPayload payload for muting an entity.
type MuteUserPayload struct {
	MutedType    string `json:"muted_type" binding:"required"`
	MutedID      string `json:"muted_id" binding:"required"`
	DurationDays int    `json:"duration_days"`
}

// UserRestrictionPayload payload for setting user restriction.
type UserRestrictionPayload struct {
	UserID           string `json:"user_id" binding:"required"`
	RestrictionScope string `json:"restriction_scope" binding:"required"`
	Reason           string `json:"reason" binding:"required"`
	DurationDays     int    `json:"duration_days"`
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

// ModerationActionPayload payload for applying moderation decision.
type ModerationActionPayload struct {
	ActionType       string `json:"action_type" binding:"required"`
	EnforcementLevel string `json:"enforcement_level"`
	Reason           string `json:"reason" binding:"required"`
	PolicyVersion    string `json:"policy_version"`
	DurationDays     int    `json:"duration_days"`
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
	Status          string     `json:"status" db:"status"` // submitted, under_review, needs_info, approved, denied, partially_approved, closed
	ReviewedBy      *uuid.UUID `json:"reviewed_by,omitempty" db:"reviewed_by"`
	ResolutionNotes string     `json:"resolution_notes,omitempty" db:"resolution_notes"`
	SubmittedAt     time.Time  `json:"submitted_at" db:"submitted_at"`
	ResolvedAt      *time.Time `json:"resolved_at,omitempty" db:"resolved_at"`
}

// AppealSubmitPayload payload for submitting an appeal.
type AppealSubmitPayload struct {
	DecisionID   string   `json:"decision_id" binding:"required"`
	Reason       string   `json:"reason" binding:"required"`
	Explanation  string   `json:"explanation" binding:"required"`
	EvidenceURLs []string `json:"evidence_urls"`
}

// ClaimCasePayload payload for claiming a moderation case.
type ClaimCasePayload struct {
	CaseID string `json:"case_id" binding:"required"`
}

// AssignCasePayload payload for assigning a case to an admin or team.
type AssignCasePayload struct {
	CaseID  string `json:"case_id" binding:"required"`
	AdminID string `json:"admin_id"`
	Team    string `json:"team"`
}

// ResolveAppealPayload payload for resolving an appeal.
type ResolveAppealPayload struct {
	AppealID        string `json:"appeal_id" binding:"required"`
	Status          string `json:"status" binding:"required"` // approved, denied, partially_approved
	ResolutionNotes string `json:"resolution_notes" binding:"required"`
}

// UpdateReportStatusPayload payload for updating report status.
type UpdateReportStatusPayload struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
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

// SafetyRule represents configurable safety policy rules.
type SafetyRule struct {
	ID                   uuid.UUID `json:"id" db:"id"`
	RuleCode             string    `json:"rule_code" db:"rule_code"`
	Name                 string    `json:"name" db:"name"`
	Category             string    `json:"category" db:"category"`
	ConditionJSON        string    `json:"condition_json" db:"condition_json"`
	ActionRecommendation string    `json:"action_recommendation" db:"action_recommendation"`
	Severity             string    `json:"severity" db:"severity"`
	Version              string    `json:"version" db:"version"`
	IsActive             bool      `json:"is_active" db:"is_active"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// SafetyMetricsSummary represents aggregate metrics for admin safety dashboard.
type SafetyMetricsSummary struct {
	OpenReports           int64            `json:"open_reports"`
	HighRiskReports       int64            `json:"high_risk_reports"`
	AverageResolutionTime string           `json:"average_resolution_time"`
	PendingAppeals        int64            `json:"pending_appeals"`
	UserBlocks            int64            `json:"user_blocks"`
	ContentRemovals       int64            `json:"content_removals"`
	AccountSuspensions    int64            `json:"account_suspensions"`
	ReportsByCategory     map[string]int64 `json:"reports_by_category"`
}

// SafetyPolicyItem represents a formal trust & safety policy version item.
type SafetyPolicyItem struct {
	ID                  uuid.UUID `json:"id" db:"id"`
	Code                string    `json:"code" db:"code"`
	Title               string    `json:"title" db:"title"`
	Category            string    `json:"category" db:"category"`
	Description         string    `json:"description" db:"description"`
	Severity            string    `json:"severity" db:"severity"`
	EnforcementGuidance string    `json:"enforcement_guidance" db:"enforcement_guidance"`
	Version             string    `json:"version" db:"version"`
	IsActive            bool      `json:"is_active" db:"is_active"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
}

// ReputationSignal represents user trust score and violation history.
type ReputationSignal struct {
	UserID                   uuid.UUID `json:"user_id" db:"user_id"`
	Score                    float64   `json:"score" db:"score"` // 0-100
	ConfirmedViolationsCount int       `json:"confirmed_violations_count" db:"confirmed_violations_count"`
	ReportsCount             int       `json:"reports_count" db:"reports_count"`
	ReinstatementsCount      int       `json:"reinstatements_count" db:"reinstatements_count"`
	LastAssessedAt           time.Time `json:"last_assessed_at" db:"last_assessed_at"`
}

// EvidenceItem represents logged evidence for a safety case/report.
type EvidenceItem struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	CaseID           *uuid.UUID `json:"case_id,omitempty" db:"case_id"`
	ReportID         *uuid.UUID `json:"report_id,omitempty" db:"report_id"`
	Source           string     `json:"source" db:"source"`                 // user_upload, system_log, automated_scan, admin_note
	EvidenceType     string     `json:"evidence_type" db:"evidence_type"`   // screenshot, log_file, message_transcript, document_hash
	FileHash         string     `json:"file_hash,omitempty" db:"file_hash"`
	ContentPreview   string     `json:"content_preview,omitempty" db:"content_preview"`
	AccessRestricted bool       `json:"access_restricted" db:"access_restricted"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
}

// ModeratorWorkload represents moderator case assignments and SLA performance.
type ModeratorWorkload struct {
	AdminID                uuid.UUID `json:"admin_id" db:"admin_id"`
	AssignedCasesCount     int       `json:"assigned_cases_count" db:"assigned_cases_count"`
	PendingAppealsCount    int       `json:"pending_appeals_count" db:"pending_appeals_count"`
	AverageResolutionMins float64   `json:"average_resolution_mins" db:"average_resolution_mins"`
	SLAStatus              string    `json:"sla_status" db:"sla_status"` // on_track, warning, breached
}

// CreatePolicyPayload payload for creating a safety policy.
type CreatePolicyPayload struct {
	Code                string `json:"code" binding:"required"`
	Title               string `json:"title" binding:"required"`
	Category            string `json:"category" binding:"required"`
	Description         string `json:"description" binding:"required"`
	Severity            string `json:"severity" binding:"required"`
	EnforcementGuidance string `json:"enforcement_guidance" binding:"required"`
	Version             string `json:"version"`
}

// UpdatePolicyPayload payload for updating a safety policy.
type UpdatePolicyPayload struct {
	Title               string `json:"title"`
	Description         string `json:"description"`
	Severity            string `json:"severity"`
	EnforcementGuidance string `json:"enforcement_guidance"`
	Version             string `json:"version"`
	IsActive            *bool  `json:"is_active"`
}

// ReinstateUserPayload payload for reinstating a restricted user.
type ReinstateUserPayload struct {
	UserID           string `json:"user_id" binding:"required"`
	Reason           string `json:"reason" binding:"required"`
	LiftRestrictions bool   `json:"lift_restrictions"`
}
