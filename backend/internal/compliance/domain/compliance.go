package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrUserUnderLegalHold = errors.New("user is currently under an active legal hold; deletion and retention purge blocked")
	ErrRequestNotFound    = errors.New("data subject request not found")
	ErrPolicyNotFound     = errors.New("retention policy not found")
	ErrHoldNotFound       = errors.New("legal hold not found")
)

const (
	ConsentAnalytics  = "analytics"
	ConsentMarketing  = "marketing"
	ConsentThirdParty = "third_party_sharing"

	RequestTypeExport   = "data_export"
	RequestTypeDeletion = "account_deletion"

	RequestStatusPending    = "pending"
	RequestStatusProcessing = "processing"
	RequestStatusCompleted  = "completed"
	RequestStatusRejected   = "rejected"

	LegalHoldStatusActive   = "active"
	LegalHoldStatusReleased = "released"
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
	Status      string     `json:"status"`       // 'pending', 'processing', 'completed', 'rejected'
	Priority    string     `json:"priority,omitempty"`
	AssignedTo  *uuid.UUID `json:"assigned_to,omitempty"`
	DownloadURL string     `json:"download_url,omitempty"`
	Notes       string     `json:"notes,omitempty"`
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
	UserID       uuid.UUID                `json:"user_id"`
	ExportedAt   time.Time                `json:"exported_at"`
	UserProfile  map[string]interface{}   `json:"user_profile"`
	Applications []map[string]interface{} `json:"applications"`
	Resumes      []map[string]interface{} `json:"resumes"`
	Messages     []map[string]interface{} `json:"messages"`
	AuditEvents  []AuditEvent             `json:"audit_events"`
}

type UpdateConsentPayload struct {
	ConsentType string `json:"consent_type" binding:"required"`
	IsGranted   bool   `json:"is_granted"`
}

type DataInventoryItem struct {
	ID                  uuid.UUID `json:"id"`
	DataDomain          string    `json:"data_domain"`
	TableName           string    `json:"table_name"`
	ColumnName          string    `json:"column_name"`
	ClassificationLevel string    `json:"classification_level"` // Public, Internal, Confidential, Restricted/PII
	PIIType             string    `json:"pii_type"`
	RetentionPeriodDays int       `json:"retention_period_days"`
	OwnerTeam           string    `json:"owner_team"`
	Description         string    `json:"description"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type DataSubjectRequestItem struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	RequestType string     `json:"request_type"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	AssignedTo  *uuid.UUID `json:"assigned_to,omitempty"`
	DownloadURL string     `json:"download_url,omitempty"`
	Notes       string     `json:"notes,omitempty"`
	RequestedAt time.Time  `json:"requested_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type DataSubjectRequestEvent struct {
	ID        uuid.UUID `json:"id"`
	RequestID uuid.UUID `json:"request_id"`
	ActorID   uuid.UUID `json:"actor_id"`
	EventType string    `json:"event_type"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

type DataExportPackage struct {
	UserID       uuid.UUID                `json:"user_id"`
	ExportedAt   time.Time                `json:"exported_at"`
	UserProfile  map[string]interface{}   `json:"user_profile"`
	Experiences  []map[string]interface{} `json:"experiences,omitempty"`
	Education    []map[string]interface{} `json:"education,omitempty"`
	Skills       []map[string]interface{} `json:"skills,omitempty"`
	Jobs         []map[string]interface{} `json:"jobs,omitempty"`
	Applications []map[string]interface{} `json:"applications,omitempty"`
	SavedJobs    []map[string]interface{} `json:"saved_jobs,omitempty"`
	Connections  []map[string]interface{} `json:"connections,omitempty"`
	Communities  []map[string]interface{} `json:"communities,omitempty"`
	Mentorship   []map[string]interface{} `json:"mentorship,omitempty"`
	Learning     []map[string]interface{} `json:"learning,omitempty"`
	Settings     map[string]interface{}   `json:"settings,omitempty"`
	AuditEvents  []AuditEvent             `json:"audit_events,omitempty"`
}

type RetentionPolicyItem struct {
	ID               uuid.UUID  `json:"id"`
	DataDomain       string     `json:"data_domain"`
	RetentionDays    int        `json:"retention_days"`
	AutoPurgeEnabled bool       `json:"auto_purge_enabled"`
	Description      string     `json:"description"`
	LastRunAt        *time.Time `json:"last_run_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type LegalHoldItem struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	Reason        string     `json:"reason"`
	ReferenceCase string     `json:"reference_case"`
	Status        string     `json:"status"` // 'active', 'released'
	CreatedBy     uuid.UUID  `json:"created_by"`
	CreatedAt     time.Time  `json:"created_at"`
	ReleasedAt    *time.Time `json:"released_at,omitempty"`
	ReleaseReason string     `json:"release_reason,omitempty"`
}

type RunRetentionPayload struct {
	DataDomain string `json:"data_domain" binding:"required"`
	DryRun     bool   `json:"dry_run"`
}

type DryRunResult struct {
	DataDomain             string    `json:"data_domain"`
	RetentionDays          int       `json:"retention_days"`
	EligibleCount          int       `json:"eligible_count"`
	LegalHoldShieldedCount int       `json:"legal_hold_shielded_count"`
	PurgeableCount         int       `json:"purgeable_count"`
	SampleRecordIDs        []string  `json:"sample_record_ids"`
	ExecutedAt             time.Time `json:"executed_at"`
}

type DataAccessReviewItem struct {
	ID           uuid.UUID  `json:"id"`
	ReviewerID   uuid.UUID  `json:"reviewer_id"`
	TargetUserID uuid.UUID  `json:"target_user_id"`
	RoleReviewed string     `json:"role_reviewed"`
	Status       string     `json:"status"`   // 'pending', 'completed'
	Decision     string     `json:"decision"` // 'approved', 'revoked', 'flagged'
	Comments     string     `json:"comments"`
	ReviewedAt   *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type ThirdPartyProcessorItem struct {
	ID                     uuid.UUID `json:"id"`
	VendorName             string    `json:"vendor_name"`
	Purpose                string    `json:"purpose"`
	DataCategories         []string  `json:"data_categories"`
	DPAStatus              string    `json:"dpa_status"` // 'signed', 'pending', 'expired'
	SubProcessors          []string  `json:"sub_processors"`
	CrossBorderMechanism   string    `json:"cross_border_mechanism"`
	SecurityCertifications []string  `json:"security_certifications"`
	RiskRating             string    `json:"risk_rating"` // 'low', 'medium', 'high'
	LastAuditDate          string    `json:"last_audit_date,omitempty"`
	UpdatedAt              time.Time `json:"updated_at"`
}

type CrossBorderTransferControl struct {
	ID                     uuid.UUID `json:"id"`
	RegionName             string    `json:"region_name"`
	ProcessorName          string    `json:"processor_name"`
	LegalBasis             string    `json:"legal_basis"`
	TransferImpactAssessed bool      `json:"transfer_impact_assessed"`
	Status                 string    `json:"status"`
	Safeguards             string    `json:"safeguards"`
	ReviewedAt             time.Time `json:"reviewed_at"`
}

type DataQualityCheckItem struct {
	ID           uuid.UUID              `json:"id"`
	CheckName    string                 `json:"check_name"`
	TargetTable  string                 `json:"target_table"`
	MetricType   string                 `json:"metric_type"` // 'completeness', 'accuracy', 'freshness'
	Status       string                 `json:"status"`      // 'passed', 'warning', 'failed'
	Score        float64                `json:"score"`
	AnomalyCount int                    `json:"anomaly_count"`
	Details      map[string]interface{} `json:"details"`
	ExecutedAt   time.Time              `json:"executed_at"`
}

type PrivacyRiskSummary struct {
	OverallRiskScore            float64   `json:"overall_risk_score"`
	HighRiskCount               int       `json:"high_risk_count"`
	MediumRiskCount             int       `json:"medium_risk_count"`
	LowRiskCount                int       `json:"low_risk_count"`
	OpenDSRCount                int       `json:"open_dsr_count"`
	OverdueDSRCount             int       `json:"overdue_dsr_count"`
	ActiveLegalHoldCount        int       `json:"active_legal_hold_count"`
	UnassignedDPAProcessorCount int       `json:"unassigned_dpa_processor_count"`
	LastUpdated                 time.Time `json:"last_updated"`
}

type ComplianceOverview struct {
	GDPRCompliant                   bool               `json:"gdpr_compliant"`
	CCPACompliant                   bool               `json:"ccpa_compliant"`
	TotalDataSubjectRequests        int                `json:"total_data_subject_requests"`
	CompletedDSRCount               int                `json:"completed_dsr_count"`
	ActiveLegalHolds                int                `json:"active_legal_holds"`
	ActiveRetentionPolicies         int                `json:"active_retention_policies"`
	AverageDSROrderFulfillmentDays float64            `json:"average_dsr_order_fulfillment_days"`
	RiskSummary                     PrivacyRiskSummary `json:"risk_summary"`
}

type PrivacyIncidentItem struct {
	ID                uuid.UUID  `json:"id"`
	Title             string     `json:"title"`
	Severity          string     `json:"severity"` // 'low', 'medium', 'high', 'critical'
	Status            string     `json:"status"`   // 'investigating', 'contained', 'resolved'
	ImpactedUserCount int        `json:"impacted_user_count"`
	BreachType        string     `json:"breach_type"`
	ReportedBy        uuid.UUID  `json:"reported_by"`
	ReportedAt        time.Time  `json:"reported_at"`
	ResolvedAt        *time.Time `json:"resolved_at,omitempty"`
	Summary           string     `json:"summary"`
}

type PolicyVersionItem struct {
	ID             uuid.UUID `json:"id"`
	VersionString  string    `json:"version_string"`
	Title          string    `json:"title"`
	EffectiveDate  string    `json:"effective_date"`
	ChangesSummary string    `json:"changes_summary"`
	Status         string    `json:"status"` // 'draft', 'published', 'archived'
	CreatedBy      uuid.UUID `json:"created_by"`
	CreatedAt      time.Time `json:"created_at"`
}

type CreateDataRequestPayload struct {
	UserID      uuid.UUID `json:"user_id"`
	RequestType string    `json:"request_type" binding:"required"`
	Priority    string    `json:"priority"`
	Notes       string    `json:"notes"`
}

type CreateLegalHoldPayload struct {
	UserID        uuid.UUID `json:"user_id" binding:"required"`
	Reason        string    `json:"reason" binding:"required"`
	ReferenceCase string    `json:"reference_case" binding:"required"`
	CreatedBy     uuid.UUID `json:"created_by"`
}

type CreateAccessReviewPayload struct {
	ReviewerID   uuid.UUID `json:"reviewer_id"`
	TargetUserID uuid.UUID `json:"target_user_id" binding:"required"`
	RoleReviewed string    `json:"role_reviewed" binding:"required"`
	Status       string    `json:"status"`
	Decision     string    `json:"decision" binding:"required"`
	Comments     string    `json:"comments"`
}

type CreatePrivacyIncidentPayload struct {
	Title             string    `json:"title" binding:"required"`
	Severity          string    `json:"severity" binding:"required"`
	ImpactedUserCount int       `json:"impacted_user_count"`
	BreachType        string    `json:"breach_type"`
	ReportedBy        uuid.UUID `json:"reported_by"`
	Summary           string    `json:"summary" binding:"required"`
}

type CreatePolicyVersionPayload struct {
	VersionString  string    `json:"version_string" binding:"required"`
	Title          string    `json:"title" binding:"required"`
	EffectiveDate  string    `json:"effective_date" binding:"required"`
	ChangesSummary string    `json:"changes_summary" binding:"required"`
	CreatedBy      uuid.UUID `json:"created_by"`
}
