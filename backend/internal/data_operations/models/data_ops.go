package models

import (
	"time"

	"github.com/google/uuid"
)

type ImportType string
type ImportStatus string
type ImportStrategy string
type ExportType string
type ExportFormat string
type ExportStatus string
type BulkOperationType string
type BulkTargetScope string
type BulkOperationStatus string

const (
	ImportTypeJobs          ImportType = "jobs"
	ImportTypeUsersAuth     ImportType = "users_auth"
	ImportTypeSkills        ImportType = "skills"
	ImportTypeCategories    ImportType = "categories"
	ImportTypeReferenceData ImportType = "reference_data"

	ImportStatusPending             ImportStatus = "pending"
	ImportStatusValidating          ImportStatus = "validating"
	ImportStatusReady               ImportStatus = "ready"
	ImportStatusProcessing          ImportStatus = "processing"
	ImportStatusCompleted           ImportStatus = "completed"
	ImportStatusCompletedWithErrors ImportStatus = "completed_with_errors"
	ImportStatusFailed              ImportStatus = "failed"
	ImportStatusCancelled           ImportStatus = "cancelled"
	ImportStatusExpired             ImportStatus = "expired"

	StrategyCreateOnly       ImportStrategy = "create_only"
	StrategyCreateOrUpdate   ImportStrategy = "create_or_update"
	StrategyUpdateOnly       ImportStrategy = "update_only"
	StrategySkipDuplicates   ImportStrategy = "skip_duplicates"
	StrategyRejectDuplicates ImportStrategy = "reject_duplicates"

	ExportTypeUserData        ExportType = "user_personal_data"
	ExportTypeAdminUsers      ExportType = "admin_users"
	ExportTypeAdminJobs       ExportType = "admin_jobs"
	ExportTypeAdminApps       ExportType = "admin_applications"
	ExportTypeAdminCommunities ExportType = "admin_communities"
	ExportTypeAdminReports    ExportType = "admin_reports"
	ExportTypeAdminAnalytics  ExportType = "admin_analytics"

	ExportFormatZIP  ExportFormat = "zip"
	ExportFormatCSV  ExportFormat = "csv"
	ExportFormatJSON ExportFormat = "json"

	ExportStatusPending    ExportStatus = "pending"
	ExportStatusProcessing ExportStatus = "processing"
	ExportStatusCompleted  ExportStatus = "completed"
	ExportStatusFailed     ExportStatus = "failed"
	ExportStatusCancelled  ExportStatus = "cancelled"
	ExportStatusExpired    ExportStatus = "expired"

	BulkStatusUpdate  BulkOperationType = "bulk_status_update"
	BulkArchive       BulkOperationType = "bulk_archive"
	BulkAssignment    BulkOperationType = "bulk_assignment"
	BulkModeration    BulkOperationType = "bulk_moderation"
	BulkNotification  BulkOperationType = "bulk_notification"

	ScopeJobs        BulkTargetScope = "jobs"
	ScopeApplications BulkTargetScope = "applications"
	ScopeUsers        BulkTargetScope = "users"
	ScopeReports      BulkTargetScope = "reports"
	ScopeSupport     BulkTargetScope = "support_tickets"

	BulkStatusPending    BulkOperationStatus = "pending"
	BulkStatusPreview    BulkOperationStatus = "preview"
	BulkStatusProcessing BulkOperationStatus = "processing"
	BulkStatusCompleted  BulkOperationStatus = "completed"
	BulkStatusFailed     BulkOperationStatus = "failed"
	BulkStatusCancelled  BulkOperationStatus = "cancelled"
)

type DataImport struct {
	ID               uuid.UUID              `json:"id" db:"id"`
	ImportType       ImportType             `json:"importType" db:"import_type"`
	Status           ImportStatus           `json:"status" db:"status"`
	Strategy         ImportStrategy         `json:"strategy" db:"strategy"`
	OriginalFilename string                 `json:"originalFilename" db:"original_filename"`
	FileSizeBytes    int64                  `json:"fileSizeBytes" db:"file_size_bytes"`
	MIMEType         string                 `json:"mimeType" db:"mime_type"`
	ColumnMapping    map[string]string      `json:"columnMapping" db:"column_mapping"`
	TotalRows        int                    `json:"totalRows" db:"total_rows"`
	ProcessedRows    int                    `json:"processedRows" db:"processed_rows"`
	SuccessfulRows   int                    `json:"successfulRows" db:"successful_rows"`
	FailedRows       int                    `json:"failedRows" db:"failed_rows"`
	SkippedRows      int                    `json:"skippedRows" db:"skipped_rows"`
	ErrorReportURL   string                 `json:"errorReportUrl,omitempty" db:"error_report_url"`
	RequestedBy      uuid.UUID              `json:"requestedBy" db:"requested_by"`
	StartedAt        *time.Time             `json:"startedAt,omitempty" db:"started_at"`
	CompletedAt      *time.Time             `json:"completedAt,omitempty" db:"completed_at"`
	ExpiresAt        time.Time              `json:"expiresAt" db:"expires_at"`
	CreatedAt        time.Time              `json:"createdAt" db:"created_at"`
}

type ImportErrorRecord struct {
	ID           uuid.UUID              `json:"id" db:"id"`
	ImportID     uuid.UUID              `json:"importId" db:"import_id"`
	RowNumber    int                    `json:"rowNumber" db:"row_number"`
	FieldName    string                 `json:"fieldName" db:"field_name"`
	ErrorType    string                 `json:"errorType" db:"error_type"`
	ErrorMessage string                 `json:"errorMessage" db:"error_message"`
	RawData      map[string]interface{} `json:"rawData" db:"raw_data"`
	CreatedAt    time.Time              `json:"createdAt" db:"created_at"`
}

type DataExport struct {
	ID             uuid.UUID              `json:"id" db:"id"`
	ExportType     ExportType             `json:"exportType" db:"export_type"`
	Format         ExportFormat           `json:"format" db:"format"`
	Status         ExportStatus           `json:"status" db:"status"`
	Filters        map[string]interface{} `json:"filters" db:"filters"`
	FieldsSelected []string               `json:"fieldsSelected" db:"fields_selected"`
	IncludePII     bool                   `json:"includePii" db:"include_pii"`
	FileSizeBytes  int64                  `json:"fileSizeBytes" db:"file_size_bytes"`
	DownloadURL    string                 `json:"downloadUrl,omitempty" db:"download_url"`
	Manifest       map[string]interface{} `json:"manifest" db:"manifest"`
	ExportVersion  string                 `json:"exportVersion" db:"export_version"`
	RequestedBy    uuid.UUID              `json:"requestedBy" db:"requested_by"`
	StartedAt      *time.Time             `json:"startedAt,omitempty" db:"started_at"`
	CompletedAt    *time.Time             `json:"completedAt,omitempty" db:"completed_at"`
	ExpiresAt      time.Time              `json:"expiresAt" db:"expires_at"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
}

type BulkOperation struct {
	ID               uuid.UUID              `json:"id" db:"id"`
	OperationType    BulkOperationType      `json:"operationType" db:"operation_type"`
	TargetScope      BulkTargetScope        `json:"targetScope" db:"target_scope"`
	Status           BulkOperationStatus    `json:"status" db:"status"`
	TotalTargetCount int                    `json:"totalTargetCount" db:"total_target_count"`
	ProcessedCount   int                    `json:"processedCount" db:"processed_count"`
	SuccessfulCount  int                    `json:"successfulCount" db:"successful_count"`
	FailedCount      int                    `json:"failedCount" db:"failed_count"`
	Payload          map[string]interface{} `json:"payload" db:"payload"`
	RequestedBy      uuid.UUID              `json:"requestedBy" db:"requested_by"`
	StartedAt        *time.Time             `json:"startedAt,omitempty" db:"started_at"`
	CompletedAt      *time.Time             `json:"completedAt,omitempty" db:"completed_at"`
	CreatedAt        time.Time              `json:"createdAt" db:"created_at"`
}

type DataMigration struct {
	ID                    uuid.UUID  `json:"id" db:"id"`
	MigrationCode         string     `json:"migrationCode" db:"migration_code"`
	Title                 string     `json:"title" db:"title"`
	Version               string     `json:"version" db:"version"`
	Status                string     `json:"status" db:"status"`
	SourceTable           string     `json:"sourceTable" db:"source_table"`
	TargetTable           string     `json:"targetTable" db:"target_table"`
	RecordsMigrated       int        `json:"recordsMigrated" db:"records_migrated"`
	ReconciliationMatched bool       `json:"reconciliationMatched" db:"reconciliation_matched"`
	ErrorSummary          string     `json:"errorSummary,omitempty" db:"error_summary"`
	ExecutedBy            uuid.UUID  `json:"executedBy" db:"executed_by"`
	StartedAt             time.Time  `json:"startedAt" db:"started_at"`
	CompletedAt           *time.Time `json:"completedAt,omitempty" db:"completed_at"`
	CreatedAt             time.Time  `json:"createdAt" db:"created_at"`
}

type CreateImportRequest struct {
	ImportType       ImportType        `json:"importType" binding:"required"`
	Strategy         ImportStrategy    `json:"strategy"`
	OriginalFilename string            `json:"originalFilename" binding:"required"`
	CSVContent       string            `json:"csvContent" binding:"required"`
	ColumnMapping    map[string]string `json:"columnMapping"`
}

type PreviewImportRequest struct {
	ImportType    ImportType        `json:"importType" binding:"required"`
	CSVContent    string            `json:"csvContent" binding:"required"`
	ColumnMapping map[string]string `json:"columnMapping"`
}

type ImportPreviewResult struct {
	DetectedColumns []string                 `json:"detectedColumns"`
	MappedFields    map[string]string        `json:"mappedFields"`
	SampleRows      []map[string]string      `json:"sampleRows"`
	TotalRows       int                      `json:"totalRows"`
	ValidRowsCount  int                      `json:"validRowsCount"`
	InvalidRowsCount int                     `json:"invalidRowsCount"`
	DuplicateCount  int                      `json:"duplicateCount"`
	ValidationErrors []map[string]interface{} `json:"validationErrors"`
}

type CreateExportRequest struct {
	ExportType     ExportType             `json:"exportType" binding:"required"`
	Format         ExportFormat           `json:"format" binding:"required"`
	Filters        map[string]interface{} `json:"filters"`
	FieldsSelected []string               `json:"fieldsSelected"`
	IncludePII     bool                   `json:"includePii"`
}

type ExecuteBulkOpRequest struct {
	OperationType BulkOperationType      `json:"operationType" binding:"required"`
	TargetScope   BulkTargetScope        `json:"targetScope" binding:"required"`
	TargetIDs     []string               `json:"targetIds" binding:"required"`
	ActionPayload map[string]interface{} `json:"actionPayload" binding:"required"`
	IsDryRun      bool                   `json:"isDryRun"`
}
