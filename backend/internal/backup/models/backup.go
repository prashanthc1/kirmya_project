package models

import (
	"time"

	"github.com/google/uuid"
)

type BackupType string
type BackupStatus string
type VerificationStatus string
type IncidentSeverity string
type IncidentStatus string

const (
	BackupTypeFull          BackupType = "full"
	BackupTypePITR          BackupType = "pitr_wal"
	BackupTypeObjectStorage BackupType = "object_storage"
	BackupTypeExport        BackupType = "export"

	BackupStatusPending    BackupStatus = "pending"
	BackupStatusInProgress BackupStatus = "in_progress"
	BackupStatusCompleted  BackupStatus = "completed"
	BackupStatusFailed     BackupStatus = "failed"
	BackupStatusCorrupted  BackupStatus = "corrupted"

	VerificationUnverified VerificationStatus = "unverified"
	VerificationVerified   VerificationStatus = "verified"
	VerificationFailed     VerificationStatus = "failed"

	SeverityLow      IncidentSeverity = "low"
	SeverityMedium   IncidentSeverity = "medium"
	SeverityHigh     IncidentSeverity = "high"
	SeverityCritical IncidentSeverity = "critical"

	IncidentDetected      IncidentStatus = "detected"
	IncidentInvestigating IncidentStatus = "investigating"
	IncidentRestoring     IncidentStatus = "restoring"
	IncidentVerifying     IncidentStatus = "verifying"
	IncidentResolved      IncidentStatus = "resolved"
	IncidentClosed        IncidentStatus = "closed"
)

type BackupConfiguration struct {
	ID                    uuid.UUID `json:"id" db:"id"`
	BackupScheduleCron    string    `json:"backupScheduleCron" db:"backup_schedule_cron"`
	RetentionDaysDaily    int       `json:"retentionDaysDaily" db:"retention_days_daily"`
	RetentionWeeksWeekly  int       `json:"retentionWeeksWeekly" db:"retention_weeks_weekly"`
	RetentionMonthsMonthly int      `json:"retentionMonthsMonthly" db:"retention_months_monthly"`
	EncryptionEnabled     bool      `json:"encryptionEnabled" db:"encryption_enabled"`
	StorageProvider       string    `json:"storageProvider" db:"storage_provider"`
	TargetRPOMinutes      int       `json:"targetRpoMinutes" db:"target_rpo_minutes"`
	TargetRTOMinutes      int       `json:"targetRtoMinutes" db:"target_rto_minutes"`
	AutoRestoreTestEnabled bool     `json:"autoRestoreTestEnabled" db:"auto_restore_test_enabled"`
	IsEnabled             bool      `json:"isEnabled" db:"is_enabled"`
	UpdatedAt             time.Time `json:"updatedAt" db:"updated_at"`
	UpdatedBy             *uuid.UUID `json:"updatedBy,omitempty" db:"updated_by"`
}

type BackupRecord struct {
	ID                 uuid.UUID          `json:"id" db:"id"`
	BackupType         BackupType         `json:"backupType" db:"backup_type"`
	Status             BackupStatus       `json:"status" db:"status"`
	SizeBytes          int64              `json:"sizeBytes" db:"size_bytes"`
	Checksum           string             `json:"checksum" db:"checksum"`
	StorageLocation    string             `json:"storageLocation" db:"storage_location"`
	AppVersion         string             `json:"appVersion" db:"app_version"`
	MigrationVersion   int                `json:"migrationVersion" db:"migration_version"`
	VerificationStatus VerificationStatus `json:"verificationStatus" db:"verification_status"`
	RetentionExpiresAt time.Time          `json:"retentionExpiresAt" db:"retention_expires_at"`
	IsImmutable        bool               `json:"isImmutable" db:"is_immutable"`
	CreatedAt          time.Time          `json:"createdAt" db:"created_at"`
	CompletedAt        *time.Time         `json:"completedAt,omitempty" db:"completed_at"`
	ErrorMessage       string             `json:"errorMessage,omitempty" db:"error_message"`
}

type BackupVerification struct {
	ID         uuid.UUID              `json:"id" db:"id"`
	BackupID   uuid.UUID              `json:"backupId" db:"backup_id"`
	VerifiedBy *uuid.UUID             `json:"verifiedBy,omitempty" db:"verified_by"`
	Status     string                 `json:"status" db:"status"`
	ChecksRun  map[string]interface{} `json:"checksRun" db:"checks_run"`
	Notes      string                 `json:"notes" db:"notes"`
	CreatedAt  time.Time              `json:"createdAt" db:"created_at"`
}

type RestoreTest struct {
	ID                  uuid.UUID              `json:"id" db:"id"`
	BackupID            uuid.UUID              `json:"backupId" db:"backup_id"`
	Environment         string                 `json:"environment" db:"environment"`
	Status              string                 `json:"status" db:"status"`
	StartedAt           time.Time              `json:"startedAt" db:"started_at"`
	CompletedAt         *time.Time             `json:"completedAt,omitempty" db:"completed_at"`
	DurationMs          int64                  `json:"durationMs" db:"duration_ms"`
	VerificationResults map[string]interface{} `json:"verificationResults" db:"verification_results"`
	FailureReason       string                 `json:"failureReason,omitempty" db:"failure_reason"`
	TestedBy            *uuid.UUID             `json:"testedBy,omitempty" db:"tested_by"`
}

type RecoveryIncident struct {
	ID                uuid.UUID        `json:"id" db:"id"`
	IncidentNumber    string           `json:"incidentNumber" db:"incident_number"`
	Title             string           `json:"title" db:"title"`
	Severity          IncidentSeverity `json:"severity" db:"severity"`
	Scenario          string           `json:"scenario" db:"scenario"`
	Status            IncidentStatus   `json:"status" db:"status"`
	RecoveryPoint     time.Time        `json:"recoveryPoint" db:"recovery_point"`
	RPOAchievedSec    int              `json:"rpoAchievedSec" db:"rpo_achieved_sec"`
	RTOAchievedSec    int              `json:"rtoAchievedSec" db:"rto_achieved_sec"`
	RootCause         string           `json:"rootCause,omitempty" db:"root_cause"`
	ResolutionSummary string           `json:"resolutionSummary,omitempty" db:"resolution_summary"`
	StartedAt         time.Time        `json:"startedAt" db:"started_at"`
	ResolvedAt        *time.Time       `json:"resolvedAt,omitempty" db:"resolved_at"`
	CreatedBy         *uuid.UUID       `json:"createdBy,omitempty" db:"created_by"`
}

type BackupHealthSummary struct {
	Status                   string     `json:"status"`
	LastSuccessfulBackupAt   *time.Time `json:"lastSuccessfulBackupAt"`
	LastFailedBackupAt       *time.Time `json:"lastFailedBackupAt"`
	BackupAgeMinutes         int        `json:"backupAgeMinutes"`
	TotalBackupSizeBytes     int64      `json:"totalBackupSizeBytes"`
	VerifiedCount            int        `json:"verifiedCount"`
	PendingCount             int        `json:"pendingCount"`
	FailedCount              int        `json:"failedCount"`
	LastRestoreTestStatus    string     `json:"lastRestoreTestStatus"`
	LastRestoreTestAt        *time.Time `json:"lastRestoreTestAt"`
	ActiveIncidentsCount     int        `json:"activeIncidentsCount"`
	RPOStatus                string     `json:"rpoStatus"`
	RTOStatus                string     `json:"rtoStatus"`
	EncryptionVaultProtected bool       `json:"encryptionVaultProtected"`
}

type TriggerBackupRequest struct {
	BackupType BackupType `json:"backupType" binding:"required"`
	Notes      string     `json:"notes"`
}

type RunRestoreTestRequest struct {
	BackupID    uuid.UUID `json:"backupId" binding:"required"`
	Environment string    `json:"environment"`
}

type ConfirmProductionRestoreRequest struct {
	BackupID            uuid.UUID `json:"backupId" binding:"required"`
	ConfirmationCode    string    `json:"confirmationCode" binding:"required"` // Must match "RESTORE-PRODUCTION-DATA"
	TargetEnvironment   string    `json:"targetEnvironment" binding:"required"`
	Reason              string    `json:"reason" binding:"required"`
	AcknowledgeDataLoss bool      `json:"acknowledgeDataLoss" binding:"required"`
}

type CreateRecoveryIncidentRequest struct {
	Title       string           `json:"title" binding:"required"`
	Severity    IncidentSeverity `json:"severity" binding:"required"`
	Scenario    string           `json:"scenario" binding:"required"`
	Description string           `json:"description"`
}

type DataTierClassification struct {
	Tier        string   `json:"tier"`
	Category    string   `json:"category"`
	DataTypes   []string `json:"dataTypes"`
	TargetRPO   string   `json:"targetRpo"`
	TargetRTO   string   `json:"targetRto"`
	Description string   `json:"description"`
}
