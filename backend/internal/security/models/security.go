package models

import (
	"time"

	"github.com/google/uuid"
)

// SecurityOverview represents high-level security status for user dashboard.
type SecurityOverview struct {
	UserID                uuid.UUID `json:"user_id"`
	EmailVerified         bool      `json:"email_verified"`
	MFAEnabled            bool      `json:"mfa_enabled"`
	ActiveSessionsCount   int       `json:"active_sessions_count"`
	TrustedDevicesCount   int       `json:"trusted_devices_count"`
	RecentSecurityEvents  int       `json:"recent_security_events"`
	PasswordLastChangedAt time.Time `json:"password_last_changed_at"`
	SecurityScore         int       `json:"security_score"` // 0 - 100
}

// PasswordChangePayload represents password update payload.
type PasswordChangePayload struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

// PasswordPolicyResult detail policy evaluation result.
type PasswordPolicyResult struct {
	IsValid        bool     `json:"is_valid"`
	Score          int      `json:"score"` // 0 - 100
	Feedback       []string `json:"feedback"`
	HasMinLength   bool     `json:"has_min_length"`
	HasUppercase   bool     `json:"has_uppercase"`
	HasLowercase   bool     `json:"has_lowercase"`
	HasNumber      bool     `json:"has_number"`
	HasSpecialChar bool     `json:"has_special_char"`
}

// MFASetupResponse returns TOTP setup QR code URI & secret.
type MFASetupResponse struct {
	Secret        string   `json:"secret"`
	QRCodeURI     string   `json:"qr_code_uri"`
	RecoveryCodes []string `json:"recovery_codes"`
}

// MFAVerifyPayload verifies TOTP code during setup or login.
type MFAVerifyPayload struct {
	Code string `json:"code" binding:"required"`
}

// SessionItem represents active user session.
type SessionItem struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	Location  string    `json:"location"`
	IsCurrent bool      `json:"is_current"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// DeviceItem represents trusted browser/device.
type DeviceItem struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	DeviceID      string    `json:"device_id"`
	Platform      string    `json:"platform"`
	Browser       string    `json:"browser"`
	OS            string    `json:"os"`
	TrustedStatus string    `json:"trusted_status"` // trusted, pending, revoked
	LastSeenAt    time.Time `json:"last_seen_at"`
	CreatedAt     time.Time `json:"created_at"`
}

// LoginHistoryItem represents past login telemetry.
type LoginHistoryItem struct {
	ID        uuid.UUID `json:"id"`
	EventType string    `json:"event_type"`
	Severity  string    `json:"severity"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	Location  string    `json:"location"`
	CreatedAt time.Time `json:"created_at"`
}

// APIKey represents registered API credential.
type APIKey struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"user_id"`
	Name       string     `json:"name"`
	KeyPrefix  string     `json:"key_prefix"`
	Scopes     string     `json:"scopes"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// CreateAPIKeyPayload payload for creating an API key.
type CreateAPIKeyPayload struct {
	Name   string `json:"name" binding:"required"`
	Scopes string `json:"scopes"`
}

// CreateAPIKeyResponse returns plain text secret once.
type CreateAPIKeyResponse struct {
	APIKey APIKey `json:"api_key"`
	Secret string `json:"secret"` // Displayed only once
}

// SecurityEvent audit record.
type SecurityEvent struct {
	ID        uuid.UUID  `json:"id"`
	UserID    *uuid.UUID `json:"user_id,omitempty"`
	EventType string     `json:"event_type"`
	Severity  string     `json:"severity"`
	IPAddress string     `json:"ip_address"`
	UserAgent string     `json:"user_agent"`
	Location  string     `json:"location"`
	Details   string     `json:"details,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// PrivacySettings represents user privacy preferences.
type PrivacySettings struct {
	UserID               uuid.UUID `json:"user_id"`
	ProfileVisibility    string    `json:"profile_visibility"` // public, connections, private
	DataSharingOptIn     bool      `json:"data_sharing_opt_in"`
	AnalyticsOptIn       bool      `json:"analytics_opt_in"`
	PersonalizationOptIn bool      `json:"personalization_opt_in"`
	SearchEngineIndexing bool      `json:"search_engine_indexing"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// PrivacySettingsPayload payload for updating privacy settings.
type PrivacySettingsPayload struct {
	ProfileVisibility    string `json:"profile_visibility"`
	DataSharingOptIn     bool   `json:"data_sharing_opt_in"`
	AnalyticsOptIn       bool   `json:"analytics_opt_in"`
	PersonalizationOptIn bool   `json:"personalization_opt_in"`
	SearchEngineIndexing bool   `json:"search_engine_indexing"`
}

// DataExportRequest represents user data export process.
type DataExportRequest struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Status      string     `json:"status"` // pending, processing, completed, failed
	ExportURL   string     `json:"export_url,omitempty"`
	RequestedAt time.Time  `json:"requested_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

// AccountDeletionRequest represents GDPR/privacy account deletion request.
type AccountDeletionRequest struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	Reason          string    `json:"reason,omitempty"`
	ConfirmPassword string    `json:"confirm_password,omitempty"`
	ScheduledFor    time.Time `json:"scheduled_for"`
	Status          string    `json:"status"` // pending, processing, completed, cancelled
	RequestedAt     time.Time `json:"requested_at"`
}

// SecurityIncident represents admin incident lifecycle.
type SecurityIncident struct {
	ID              uuid.UUID  `json:"id"`
	Title           string     `json:"title"`
	Severity        string     `json:"severity"` // low, medium, high, critical
	Status          string     `json:"status"`   // open, investigating, contained, resolved, closed
	AssignedTo      *uuid.UUID `json:"assigned_to,omitempty"`
	AffectedArea    string     `json:"affected_area"`
	Description     string     `json:"description"`
	ResolutionNotes string     `json:"resolution_notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	ResolvedAt      *time.Time `json:"resolved_at,omitempty"`
}

// SecurityDashboardSummary summary metrics for admin security console.
type SecurityDashboardSummary struct {
	TotalEvents          int64            `json:"total_events"`
	FailedLogins24h      int64            `json:"failed_logins_24h"`
	SuspiciousActivities int64            `json:"suspicious_activities"`
	MFAAdoptionRate      float64          `json:"mfa_adoption_rate"`
	ActiveIncidents      int64            `json:"active_incidents"`
	EventsByType         map[string]int64 `json:"events_by_type"`
}

// SecurityEventDetail represents extended telemetry with trace correlation ID.
type SecurityEventDetail struct {
	ID            uuid.UUID              `json:"id"`
	CorrelationID string                 `json:"correlation_id"`
	ActorID       string                 `json:"actor_id"`
	TargetEntity  string                 `json:"target_entity"`
	RiskLevel     string                 `json:"risk_level"`
	RiskScore     int                    `json:"risk_score"`
	SafeDetails   map[string]interface{} `json:"safe_details"`
	CreatedAt     time.Time              `json:"created_at"`
}

// SecurityAlert represents a SOC threat alert record.
type SecurityAlert struct {
	ID              uuid.UUID  `json:"id"`
	Title           string     `json:"title"`
	Severity        string     `json:"severity"` // Informational, Low, Medium, High, Critical
	RiskScore       int        `json:"risk_score"`
	Category        string     `json:"category"`
	TriggerEvent    string     `json:"trigger_event"`
	Status          string     `json:"status"` // New, Investigating, Mitigated, Resolved, False Positive, Escalated
	AssignedAdminID *uuid.UUID `json:"assigned_admin_id,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	ResolvedAt      *time.Time `json:"resolved_at,omitempty"`
	ResolutionNotes string     `json:"resolution_notes,omitempty"`
}

// SecurityRule represents real-time dynamic traffic enforcement rule.
type SecurityRule struct {
	RuleID             string    `json:"rule_id"`
	Name               string    `json:"name"`
	Category           string    `json:"category"`
	ThresholdCount     int       `json:"threshold_count"`
	TimeWindowSeconds int       `json:"time_window_seconds"`
	Action             string    `json:"action"` // log, rate_limit, require_mfa, temporary_restrict, block
	IsEnabled          bool      `json:"is_enabled"`
	UpdatedBy          string    `json:"updated_by"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// AccountRiskScore represents user risk score (0-100) and factors.
type AccountRiskScore struct {
	UserID          uuid.UUID `json:"user_id"`
	Score           int       `json:"score"`      // 0 - 100
	RiskLevel       string    `json:"risk_level"` // Normal, Low, Medium, High, Critical
	Factors         []string  `json:"factors"`
	LastEvaluatedAt time.Time `json:"last_evaluated_at"`
}

// BotDetectionSignal represents bot detection analysis.
type BotDetectionSignal struct {
	ID                 uuid.UUID `json:"id"`
	IPAddress          string    `json:"ip_address"`
	UserAgent          string    `json:"user_agent"`
	BurstRate          int       `json:"burst_rate"`
	EndpointPattern    string    `json:"endpoint_pattern"`
	BotConfidenceScore int       `json:"bot_confidence_score"` // 0 - 100
	IsBot              bool      `json:"is_bot"`
	CreatedAt          time.Time `json:"created_at"`
}

// FraudAlert represents detected fraud incident.
type FraudAlert struct {
	ID         uuid.UUID `json:"id"`
	EntityType string    `json:"entity_type"` // user, job_posting, application, message
	EntityID   string    `json:"entity_id"`
	FraudType  string    `json:"fraud_type"`  // fake_job, mass_application, spam_messaging, registration_burst
	Score      int       `json:"score"`
	Reasons    []string  `json:"reasons"`
	Status     string    `json:"status"` // New, Investigating, Mitigated, Resolved, False Positive
	CreatedAt  time.Time `json:"created_at"`
}

// UpdateSecurityRulePayload payload for updating a security rule.
type UpdateSecurityRulePayload struct {
	ThresholdCount     *int    `json:"threshold_count,omitempty"`
	TimeWindowSeconds *int    `json:"time_window_seconds,omitempty"`
	Action             *string `json:"action,omitempty"`
	IsEnabled          *bool   `json:"is_enabled,omitempty"`
}

// UpdateSecurityAlertPayload payload for updating an alert.
type UpdateSecurityAlertPayload struct {
	Status          *string    `json:"status,omitempty"`
	AssignedAdminID *uuid.UUID `json:"assigned_admin_id,omitempty"`
	ResolutionNotes *string    `json:"resolution_notes,omitempty"`
}

// ResolveAlertPayload payload for resolving an alert.
type ResolveAlertPayload struct {
	ResolutionNotes string `json:"resolution_notes" binding:"required"`
	Status          string `json:"status"` // Resolved or False Positive
}

