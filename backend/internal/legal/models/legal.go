package models

import (
	"time"

	"github.com/google/uuid"
)

// LegalDocument represents a managed legal text document.
type LegalDocument struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	Slug           string     `json:"slug" db:"slug"`
	DocumentType   string     `json:"document_type" db:"document_type"`
	Title          string     `json:"title" db:"title"`
	Locale         string     `json:"locale" db:"locale"`
	CurrentVersion string     `json:"current_version" db:"current_version"`
	Status         string     `json:"status" db:"status"` // draft, scheduled, published, archived
	EffectiveDate  time.Time  `json:"effective_date" db:"effective_date"`
	PublishedDate  *time.Time `json:"published_date,omitempty" db:"published_date"`
	CreatedBy      *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy      *uuid.UUID `json:"updated_by,omitempty" db:"updated_by"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

// LegalDocumentVersion represents an immutable historical snapshot.
type LegalDocumentVersion struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	DocumentID    uuid.UUID  `json:"document_id" db:"document_id"`
	Version       string     `json:"version" db:"version"`
	Title         string     `json:"title" db:"title"`
	Content       string     `json:"content" db:"content"`
	ChangeSummary string     `json:"change_summary,omitempty" db:"change_summary"`
	EffectiveDate time.Time  `json:"effective_date" db:"effective_date"`
	Status        string     `json:"status" db:"status"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
}

// LegalAcceptance represents user acceptance record.
type LegalAcceptance struct {
	ID                uuid.UUID `json:"id" db:"id"`
	UserID            uuid.UUID `json:"user_id" db:"user_id"`
	DocumentID        uuid.UUID `json:"document_id" db:"document_id"`
	DocumentVersionID uuid.UUID `json:"document_version_id" db:"document_version_id"`
	Version           string    `json:"version" db:"version"`
	AcceptedAt        time.Time `json:"accepted_at" db:"accepted_at"`
	IPAddress         string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent         string    `json:"user_agent,omitempty" db:"user_agent"`
	Source            string    `json:"source" db:"source"`
}

// CookieItem represents a registered browser cookie.
type CookieItem struct {
	ID          uuid.UUID `json:"id" db:"id"`
	CookieName  string    `json:"cookie_name" db:"cookie_name"`
	Provider    string    `json:"provider" db:"provider"`
	Category    string    `json:"category" db:"category"` // necessary, preferences, analytics, functional, marketing, third_party
	Purpose     string    `json:"purpose" db:"purpose"`
	Domain      string    `json:"domain,omitempty" db:"domain"`
	Path        string    `json:"path" db:"path"`
	Duration    string    `json:"duration" db:"duration"`
	IsSecure    bool      `json:"is_secure" db:"is_secure"`
	IsHTTPOnly  bool      `json:"is_httponly" db:"is_httponly"`
	SameSite    string    `json:"samesite" db:"samesite"`
	IsRequired  bool      `json:"is_required" db:"is_required"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// CookieConsent represents visitor or user consent preferences.
type CookieConsent struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	UserID      *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	VisitorID   string     `json:"visitor_id" db:"visitor_id"`
	Necessary   bool       `json:"necessary" db:"necessary"`
	Preferences bool       `json:"preferences" db:"preferences"`
	Analytics   bool       `json:"analytics" db:"analytics"`
	Functional  bool       `json:"functional" db:"functional"`
	Marketing   bool       `json:"marketing" db:"marketing"`
	ThirdParty  bool       `json:"third_party" db:"third_party"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	IPAddress   string     `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent   string     `json:"user_agent,omitempty" db:"user_agent"`
}

// PrivacyRequest represents subject access request lifecycle.
type PrivacyRequest struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	UserID          uuid.UUID  `json:"user_id" db:"user_id"`
	RequestType     string     `json:"request_type" db:"request_type"` // access_export, deletion, correction, restriction, consent_withdrawal
	Status          string     `json:"status" db:"status"`             // received, under_review, processing, completed, rejected
	DueDate         time.Time  `json:"due_date" db:"due_date"`
	AssignedAdminID *uuid.UUID `json:"assigned_admin_id,omitempty" db:"assigned_admin_id"`
	ResolutionNotes string     `json:"resolution_notes,omitempty" db:"resolution_notes"`
	CompletedAt     *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// DataExportJob represents asynchronous export state.
type DataExportJob struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	UserID           uuid.UUID  `json:"user_id" db:"user_id"`
	PrivacyRequestID *uuid.UUID `json:"privacy_request_id,omitempty" db:"privacy_request_id"`
	Status           string     `json:"status" db:"status"` // pending, processing, completed, failed
	DownloadURL      string     `json:"download_url,omitempty" db:"download_url"`
	ExpiresAt        time.Time  `json:"expires_at" db:"expires_at"`
	FileSizeBytes    int64      `json:"file_size_bytes" db:"file_size_bytes"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	CompletedAt      *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// DataDeletionRequest represents account deletion request.
// Contains grace period and legal hold verification status.
type DataDeletionRequest struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	UserID               uuid.UUID  `json:"user_id" db:"user_id"`
	PrivacyRequestID     *uuid.UUID `json:"privacy_request_id,omitempty" db:"privacy_request_id"`
	Status               string     `json:"status" db:"status"` // grace_period, processing, completed, cancelled
	GracePeriodExpiresAt time.Time  `json:"grace_period_expires_at" db:"grace_period_expires_at"`
	ConfirmedAt          *time.Time `json:"confirmed_at,omitempty" db:"confirmed_at"`
	CompletedAt          *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	Reason               string     `json:"reason,omitempty" db:"reason"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
}

// LegalHold represents lock against data deletion.
type LegalHold struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	ResourceType string     `json:"resource_type" db:"resource_type"`
	ResourceID   uuid.UUID  `json:"resource_id" db:"resource_id"`
	Reason       string     `json:"reason" db:"reason"`
	CreatedBy    *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	IsActive     bool       `json:"is_active" db:"is_active"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	ReleasedAt   *time.Time `json:"released_at,omitempty" db:"released_at"`
}

// ThirdPartyService represents registered external sub-processor.
type ThirdPartyService struct {
	ID               uuid.UUID `json:"id" db:"id"`
	ProviderName     string    `json:"provider_name" db:"provider_name"`
	ServiceName      string    `json:"service_name" db:"service_name"`
	Purpose          string    `json:"purpose" db:"purpose"`
	DataCategory     string    `json:"data_category" db:"data_category"`
	CountryRegion    string    `json:"country_region" db:"country_region"`
	PrivacyPolicyURL string    `json:"privacy_policy_url,omitempty" db:"privacy_policy_url"`
	TermsURL         string    `json:"terms_url,omitempty" db:"terms_url"`
	IsEnabled        bool      `json:"is_enabled" db:"is_enabled"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}
