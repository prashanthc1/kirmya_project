package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	ConsentAnalytics    = "analytics"
	ConsentMarketing    = "marketing"
	ConsentThirdParty   = "third_party_sharing"

	RequestTypeExport   = "data_export"
	RequestTypeDeletion = "account_deletion"

	RequestStatusPending    = "pending"
	RequestStatusProcessing = "processing"
	RequestStatusCompleted  = "completed"
)

type ConsentRecord struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	ConsentType string    `json:"consent_type"`
	IsGranted   bool      `json:"is_granted"`
	GrantedAt   time.Time `json:"granted_at"`
	IPAddress   string    `json:"ip_address"`
}

type DataRequest struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	RequestType string     `json:"request_type"` // 'data_export', 'account_deletion'
	Status      string     `json:"status"`       // 'pending', 'processing', 'completed'
	DownloadURL string     `json:"download_url,omitempty"`
	RequestedAt time.Time  `json:"requested_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

type AuditEvent struct {
	ID        uuid.UUID              `json:"id"`
	UserID    uuid.UUID              `json:"user_id"`
	EventType string                 `json:"event_type"`
	Resource  string                 `json:"resource"`
	Details   map[string]interface{} `json:"details"`
	CreatedAt time.Time              `json:"created_at"`
}

type GDPRDataPackage struct {
	UserID        uuid.UUID              `json:"user_id"`
	ExportedAt    time.Time              `json:"exported_at"`
	UserProfile   map[string]interface{} `json:"user_profile"`
	Applications  []map[string]interface{}`json:"applications"`
	Resumes       []map[string]interface{}`json:"resumes"`
	Messages      []map[string]interface{}`json:"messages"`
	AuditEvents   []AuditEvent           `json:"audit_events"`
}

type UpdateConsentPayload struct {
	ConsentType string `json:"consent_type" binding:"required"`
	IsGranted   bool   `json:"is_granted"`
}
