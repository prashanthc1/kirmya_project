package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"strings"
	"time"

	"kirmya/internal/data_operations/models"
	"kirmya/internal/data_operations/repository"

	"github.com/google/uuid"
)

type DataOperationsService struct {
	repo *repository.DataOperationsRepository
}

func NewDataOperationsService(repo *repository.DataOperationsRepository) *DataOperationsService {
	return &DataOperationsService{repo: repo}
}

// SanitizeCSVValue strips or escapes spreadsheet formula injection prefixes (=, +, -, @).
func (s *DataOperationsService) SanitizeCSVValue(val string) string {
	trimmed := strings.TrimSpace(val)
	if len(trimmed) > 0 {
		firstChar := trimmed[0]
		if firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' {
			return "'" + trimmed
		}
	}
	return trimmed
}

func (s *DataOperationsService) PreviewImport(ctx context.Context, req models.PreviewImportRequest) (*models.ImportPreviewResult, error) {
	if req.CSVContent == "" {
		return nil, errors.New("CSV content is required for preview")
	}

	reader := csv.NewReader(bytes.NewBufferString(req.CSVContent))
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV content: %w", err)
	}

	if len(records) < 1 {
		return nil, errors.New("CSV file is empty")
	}

	headers := records[0]
	detectedCols := make([]string, len(headers))
	for i, h := range headers {
		detectedCols[i] = s.SanitizeCSVValue(h)
	}

	// Auto-map columns if not explicitly provided
	mappedFields := req.ColumnMapping
	if mappedFields == nil {
		mappedFields = make(map[string]string)
		for _, col := range detectedCols {
			lower := strings.ToLower(col)
			if strings.Contains(lower, "title") {
				mappedFields["title"] = col
			} else if strings.Contains(lower, "company") {
				mappedFields["company"] = col
			} else if strings.Contains(lower, "location") {
				mappedFields["location"] = col
			} else if strings.Contains(lower, "type") {
				mappedFields["type"] = col
			} else if strings.Contains(lower, "email") {
				mappedFields["email"] = col
			}
		}
	}

	dataRows := records[1:]
	totalRows := len(dataRows)
	validCnt := 0
	invalidCnt := 0
	duplicateCnt := 0

	var sampleRows []map[string]string
	var validationErrors []map[string]interface{}

	seenKeys := make(map[string]bool)

	for idx, row := range dataRows {
		rowMap := make(map[string]string)
		for cIdx, val := range row {
			if cIdx < len(headers) {
				rowMap[headers[cIdx]] = s.SanitizeCSVValue(val)
			}
		}

		if idx < 5 {
			sampleRows = append(sampleRows, rowMap)
		}

		// Validation rules per row
		rowNum := idx + 2
		titleVal := rowMap["title"]
		if titleVal == "" {
			titleVal = rowMap["Job Title"]
		}

		if titleVal == "" && len(row) > 0 {
			titleVal = row[0]
		}

		if strings.TrimSpace(titleVal) == "" {
			invalidCnt++
			validationErrors = append(validationErrors, map[string]interface{}{
				"row":     rowNum,
				"field":   "title",
				"error":   "Title or primary field cannot be empty",
				"rowData": rowMap,
			})
			continue
		}

		dedupKey := strings.ToLower(strings.TrimSpace(titleVal))
		if seenKeys[dedupKey] {
			duplicateCnt++
		} else {
			seenKeys[dedupKey] = true
		}

		validCnt++
	}

	return &models.ImportPreviewResult{
		DetectedColumns:  detectedCols,
		MappedFields:     mappedFields,
		SampleRows:       sampleRows,
		TotalRows:        totalRows,
		ValidRowsCount:   validCnt,
		InvalidRowsCount: invalidCnt,
		DuplicateCount:   duplicateCnt,
		ValidationErrors: validationErrors,
	}, nil
}

func (s *DataOperationsService) CreateImport(ctx context.Context, userID uuid.UUID, req models.CreateImportRequest) (*models.DataImport, error) {
	preview, err := s.PreviewImport(ctx, models.PreviewImportRequest{
		ImportType:    req.ImportType,
		CSVContent:    req.CSVContent,
		ColumnMapping: req.ColumnMapping,
	})
	if err != nil {
		return nil, err
	}

	now := time.Now()
	id := uuid.New()
	strategy := req.Strategy
	if strategy == "" {
		strategy = models.StrategyCreateOrUpdate
	}

	successful := preview.ValidRowsCount
	failed := preview.InvalidRowsCount
	skipped := 0

	if strategy == models.StrategySkipDuplicates {
		skipped = preview.DuplicateCount
		successful -= preview.DuplicateCount
	} else if strategy == models.StrategyRejectDuplicates && preview.DuplicateCount > 0 {
		failed += preview.DuplicateCount
		successful -= preview.DuplicateCount
	}

	status := models.ImportStatusCompleted
	if failed > 0 {
		status = models.ImportStatusCompletedWithErrors
	}

	completedAt := now.Add(2 * time.Second)
	errorReportURL := ""
	if failed > 0 {
		errorReportURL = fmt.Sprintf("vault://reports/import_errors_%s.csv", id.String()[:8])
	}

	imp := &models.DataImport{
		ID:               id,
		ImportType:       req.ImportType,
		Status:           status,
		Strategy:         strategy,
		OriginalFilename: req.OriginalFilename,
		FileSizeBytes:    int64(len(req.CSVContent)),
		MIMEType:         "text/csv",
		ColumnMapping:    preview.MappedFields,
		TotalRows:        preview.TotalRows,
		ProcessedRows:    preview.TotalRows,
		SuccessfulRows:   successful,
		FailedRows:       failed,
		SkippedRows:      skipped,
		ErrorReportURL:   errorReportURL,
		RequestedBy:      userID,
		StartedAt:        &now,
		CompletedAt:      &completedAt,
		ExpiresAt:        now.Add(7 * 24 * time.Hour),
		CreatedAt:        now,
	}

	if err := s.repo.CreateImport(ctx, imp); err != nil {
		return nil, err
	}

	return imp, nil
}

func (s *DataOperationsService) ListImports(ctx context.Context, userID *uuid.UUID, limit int, offset int) ([]models.DataImport, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListImports(ctx, userID, limit, offset)
}

func (s *DataOperationsService) GetImportByID(ctx context.Context, id uuid.UUID) (*models.DataImport, error) {
	return s.repo.GetImportByID(ctx, id)
}

func (s *DataOperationsService) CreateUserExport(ctx context.Context, userID uuid.UUID) (*models.DataExport, error) {
	now := time.Now()
	id := uuid.New()
	completedAt := now.Add(3 * time.Second)
	downloadToken := fmt.Sprintf("vault://exports/user_data_package_%s.zip?expires=%d&token=signed_token_%s", id.String()[:8], now.Add(24*time.Hour).Unix(), id.String()[:8])

	manifest := map[string]interface{}{
		"exportId":      id.String(),
		"requestedBy":   userID.String(),
		"createdAt":     now.Format(time.RFC3339),
		"expiresAt":     now.Add(24 * time.Hour).Format(time.RFC3339),
		"exportVersion": "v1.0",
		"dataCategories": []string{
			"Profile & Personal Identity",
			"Account Settings & Security History",
			"Job Applications & Saved Jobs",
			"Professional Connections & Invites",
			"Direct Messages Metadata",
			"Community Memberships & Posts",
			"Notifications & Consent Preferences",
		},
		"fileFormat": "zip (json & csv files)",
	}

	exp := &models.DataExport{
		ID:             id,
		ExportType:     models.ExportTypeUserData,
		Format:         models.ExportFormatZIP,
		Status:         models.ExportStatusCompleted,
		Filters:        map[string]interface{}{"scope": "all_personal_data"},
		FieldsSelected: []string{"profile", "auth", "jobs", "applications", "connections", "messages", "settings"},
		IncludePII:     true,
		FileSizeBytes:  2097152,
		DownloadURL:    downloadToken,
		Manifest:       manifest,
		ExportVersion:  "v1.0",
		RequestedBy:    userID,
		StartedAt:      &now,
		CompletedAt:    &completedAt,
		ExpiresAt:      now.Add(24 * time.Hour),
		CreatedAt:      now,
	}

	if err := s.repo.CreateExport(ctx, exp); err != nil {
		return nil, err
	}

	return exp, nil
}

func (s *DataOperationsService) CreateAdminExport(ctx context.Context, adminID uuid.UUID, req models.CreateExportRequest) (*models.DataExport, error) {
	now := time.Now()
	id := uuid.New()
	completedAt := now.Add(4 * time.Second)
	downloadURL := fmt.Sprintf("vault://exports/admin_export_%s_%s.%s?token=signed_admin_access", req.ExportType, id.String()[:8], req.Format)

	manifest := map[string]interface{}{
		"exportId":       id.String(),
		"exportType":     req.ExportType,
		"requestedBy":    adminID.String(),
		"fieldsSelected": req.FieldsSelected,
		"includePii":     req.IncludePII,
		"exportVersion":  "v1.0",
	}

	exp := &models.DataExport{
		ID:             id,
		ExportType:     req.ExportType,
		Format:         req.Format,
		Status:         models.ExportStatusCompleted,
		Filters:        req.Filters,
		FieldsSelected: req.FieldsSelected,
		IncludePII:     req.IncludePII,
		FileSizeBytes:  1048576,
		DownloadURL:    downloadURL,
		Manifest:       manifest,
		ExportVersion:  "v1.0",
		RequestedBy:    adminID,
		StartedAt:      &now,
		CompletedAt:    &completedAt,
		ExpiresAt:      now.Add(24 * time.Hour),
		CreatedAt:      now,
	}

	if err := s.repo.CreateExport(ctx, exp); err != nil {
		return nil, err
	}

	return exp, nil
}

func (s *DataOperationsService) ListExports(ctx context.Context, userID *uuid.UUID, limit int, offset int) ([]models.DataExport, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListExports(ctx, userID, limit, offset)
}

func (s *DataOperationsService) ExecuteBulkOperation(ctx context.Context, adminID uuid.UUID, req models.ExecuteBulkOpRequest) (*models.BulkOperation, error) {
	if len(req.TargetIDs) == 0 {
		return nil, errors.New("Target IDs array cannot be empty")
	}

	now := time.Now()
	id := uuid.New()
	total := len(req.TargetIDs)
	completedAt := now.Add(2 * time.Second)

	status := models.BulkStatusCompleted
	if req.IsDryRun {
		status = models.BulkStatusPreview
	}

	op := &models.BulkOperation{
		ID:               id,
		OperationType:    req.OperationType,
		TargetScope:      req.TargetScope,
		Status:           status,
		TotalTargetCount: total,
		ProcessedCount:   total,
		SuccessfulCount:  total,
		FailedCount:      0,
		Payload:          req.ActionPayload,
		RequestedBy:      adminID,
		StartedAt:        &now,
		CompletedAt:      &completedAt,
		CreatedAt:        now,
	}

	if err := s.repo.CreateBulkOperation(ctx, op); err != nil {
		return nil, err
	}

	return op, nil
}

func (s *DataOperationsService) ListBulkOperations(ctx context.Context, limit int, offset int) ([]models.BulkOperation, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListBulkOperations(ctx, limit, offset)
}

func (s *DataOperationsService) ListDataMigrations(ctx context.Context, limit int, offset int) ([]models.DataMigration, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListDataMigrations(ctx, limit, offset)
}
