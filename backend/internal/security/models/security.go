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
