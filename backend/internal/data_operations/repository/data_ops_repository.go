package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"kirmya/internal/data_operations/models"

	"github.com/google/uuid"
)

type DataOperationsRepository struct {
	db *sql.DB
}

func NewDataOperationsRepository(db *sql.DB) *DataOperationsRepository {
	return &DataOperationsRepository{db: db}
}

func (r *DataOperationsRepository) CreateImport(ctx context.Context, imp *models.DataImport) error {
	if r.db == nil {
		return nil
	}

	mappingJSON, _ := json.Marshal(imp.ColumnMapping)

	query := `
		INSERT INTO data_imports (
			id, import_type, status, strategy, original_filename, file_size_bytes, mime_type,
			column_mapping, total_rows, processed_rows, successful_rows, failed_rows, skipped_rows,
			error_report_url, requested_by, started_at, completed_at, expires_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19);
	`

	_, err := r.db.ExecContext(
		ctx, query,
		imp.ID, imp.ImportType, imp.Status, imp.Strategy, imp.OriginalFilename, imp.FileSizeBytes, imp.MIMEType,
		string(mappingJSON), imp.TotalRows, imp.ProcessedRows, imp.SuccessfulRows, imp.FailedRows, imp.SkippedRows,
		imp.ErrorReportURL, imp.RequestedBy, imp.StartedAt, imp.CompletedAt, imp.ExpiresAt, imp.CreatedAt,
	)

	return err
}

func (r *DataOperationsRepository) GetImportByID(ctx context.Context, id uuid.UUID) (*models.DataImport, error) {
	if r.db == nil {
		now := time.Now()
		comp := now.Add(-1 * time.Minute)
		return &models.DataImport{
			ID:               id,
			ImportType:       models.ImportTypeJobs,
			Status:           models.ImportStatusCompleted,
			Strategy:         models.StrategyCreateOrUpdate,
			OriginalFilename: "job_postings_q3.csv",
			FileSizeBytes:    1048576,
			MIMEType:         "text/csv",
			ColumnMapping:    map[string]string{"title": "Job Title", "company": "Company Name"},
			TotalRows:        25,
			ProcessedRows:    25,
			SuccessfulRows:   24,
			FailedRows:       1,
			SkippedRows:      0,
			RequestedBy:      uuid.New(),
			StartedAt:        &now,
			CompletedAt:      &comp,
			ExpiresAt:        now.Add(24 * time.Hour),
			CreatedAt:        now.Add(-5 * time.Minute),
		}, nil
	}

	query := `
		SELECT id, import_type, status, strategy, original_filename, file_size_bytes, mime_type,
		       column_mapping, total_rows, processed_rows, successful_rows, failed_rows, skipped_rows,
		       error_report_url, requested_by, started_at, completed_at, expires_at, created_at
		FROM data_imports
		WHERE id = $1;
	`

	row := r.db.QueryRowContext(ctx, query, id)
	imp := &models.DataImport{}
	var mappingRaw string
	var startedAt, completedAt sql.NullTime

	err := row.Scan(
		&imp.ID, &imp.ImportType, &imp.Status, &imp.Strategy, &imp.OriginalFilename, &imp.FileSizeBytes, &imp.MIMEType,
		&mappingRaw, &imp.TotalRows, &imp.ProcessedRows, &imp.SuccessfulRows, &imp.FailedRows, &imp.SkippedRows,
		&imp.ErrorReportURL, &imp.RequestedBy, &startedAt, &completedAt, &imp.ExpiresAt, &imp.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("import record not found")
	} else if err != nil {
		return nil, err
	}

	_ = json.Unmarshal([]byte(mappingRaw), &imp.ColumnMapping)
	if startedAt.Valid {
		imp.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		imp.CompletedAt = &completedAt.Time
	}

	return imp, nil
}

func (r *DataOperationsRepository) ListImports(ctx context.Context, userID *uuid.UUID, limit int, offset int) ([]models.DataImport, error) {
	if r.db == nil {
		now := time.Now()
		comp := now.Add(-1 * time.Minute)
		return []models.DataImport{
			{
				ID:               uuid.MustParse("aaaa1111-1111-1111-1111-111111111111"),
				ImportType:       models.ImportTypeJobs,
				Status:           models.ImportStatusCompleted,
				Strategy:         models.StrategyCreateOrUpdate,
				OriginalFilename: "bulk_jobs_hiring.csv",
				FileSizeBytes:    524288,
				MIMEType:         "text/csv",
				TotalRows:        50,
				ProcessedRows:    50,
				SuccessfulRows:   48,
				FailedRows:       2,
				SkippedRows:      0,
				RequestedBy:      uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				StartedAt:        &now,
				CompletedAt:      &comp,
				ExpiresAt:        now.Add(24 * time.Hour),
				CreatedAt:        now.Add(-10 * time.Minute),
			},
		}, nil
	}

	query := `
		SELECT id, import_type, status, strategy, original_filename, file_size_bytes, mime_type,
		       column_mapping, total_rows, processed_rows, successful_rows, failed_rows, skipped_rows,
		       error_report_url, requested_by, started_at, completed_at, expires_at, created_at
		FROM data_imports
		WHERE ($1::uuid IS NULL OR requested_by = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3;
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.DataImport
	for rows.Next() {
		imp := models.DataImport{}
		var mappingRaw string
		var startedAt, completedAt sql.NullTime

		err := rows.Scan(
			&imp.ID, &imp.ImportType, &imp.Status, &imp.Strategy, &imp.OriginalFilename, &imp.FileSizeBytes, &imp.MIMEType,
			&mappingRaw, &imp.TotalRows, &imp.ProcessedRows, &imp.SuccessfulRows, &imp.FailedRows, &imp.SkippedRows,
			&imp.ErrorReportURL, &imp.RequestedBy, &startedAt, &completedAt, &imp.ExpiresAt, &imp.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(mappingRaw), &imp.ColumnMapping)
		if startedAt.Valid {
			imp.StartedAt = &startedAt.Time
		}
		if completedAt.Valid {
			imp.CompletedAt = &completedAt.Time
		}
		list = append(list, imp)
	}

	return list, nil
}

func (r *DataOperationsRepository) CreateExport(ctx context.Context, exp *models.DataExport) error {
	if r.db == nil {
		return nil
	}

	filtersJSON, _ := json.Marshal(exp.Filters)
	fieldsJSON, _ := json.Marshal(exp.FieldsSelected)
	manifestJSON, _ := json.Marshal(exp.Manifest)

	query := `
		INSERT INTO data_exports (
			id, export_type, format, status, filters, fields_selected, include_pii,
			file_size_bytes, download_url, manifest, export_version, requested_by, started_at, completed_at, expires_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
	`

	_, err := r.db.ExecContext(
		ctx, query,
		exp.ID, exp.ExportType, exp.Format, exp.Status, string(filtersJSON), string(fieldsJSON), exp.IncludePII,
		exp.FileSizeBytes, exp.DownloadURL, string(manifestJSON), exp.ExportVersion, exp.RequestedBy, exp.StartedAt, exp.CompletedAt, exp.ExpiresAt, exp.CreatedAt,
	)

	return err
}

func (r *DataOperationsRepository) ListExports(ctx context.Context, userID *uuid.UUID, limit int, offset int) ([]models.DataExport, error) {
	if r.db == nil {
		now := time.Now()
		comp := now.Add(-30 * time.Second)
		return []models.DataExport{
			{
				ID:            uuid.MustParse("bbbb2222-2222-2222-2222-222222222222"),
				ExportType:    models.ExportTypeUserData,
				Format:        models.ExportFormatZIP,
				Status:        models.ExportStatusCompleted,
				IncludePII:    true,
				FileSizeBytes: 2097152,
				DownloadURL:   "vault://exports/user_data_package_bbbb2222.zip?token=signed_short_lived",
				Manifest: map[string]interface{}{
					"exportId":     "bbbb2222-2222-2222-2222-222222222222",
					"categories":   []string{"Profile", "Jobs", "Applications", "Connections", "Messages", "Settings"},
					"version":      "v1.0",
					"fileCount":    6,
				},
				ExportVersion: "v1.0",
				RequestedBy:   uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				StartedAt:     &now,
				CompletedAt:   &comp,
				ExpiresAt:     now.Add(24 * time.Hour),
				CreatedAt:     now.Add(-2 * time.Minute),
			},
		}, nil
	}

	query := `
		SELECT id, export_type, format, status, filters, fields_selected, include_pii,
		       file_size_bytes, download_url, manifest, export_version, requested_by, started_at, completed_at, expires_at, created_at
		FROM data_exports
		WHERE ($1::uuid IS NULL OR requested_by = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3;
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.DataExport
	for rows.Next() {
		exp := models.DataExport{}
		var filtersRaw, fieldsRaw, manifestRaw string
		var startedAt, completedAt sql.NullTime

		err := rows.Scan(
			&exp.ID, &exp.ExportType, &exp.Format, &exp.Status, &filtersRaw, &fieldsRaw, &exp.IncludePII,
			&exp.FileSizeBytes, &exp.DownloadURL, &manifestRaw, &exp.ExportVersion, &exp.RequestedBy, &startedAt, &completedAt, &exp.ExpiresAt, &exp.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(filtersRaw), &exp.Filters)
		_ = json.Unmarshal([]byte(fieldsRaw), &exp.FieldsSelected)
		_ = json.Unmarshal([]byte(manifestRaw), &exp.Manifest)
		if startedAt.Valid {
			exp.StartedAt = &startedAt.Time
		}
		if completedAt.Valid {
			exp.CompletedAt = &completedAt.Time
		}
		list = append(list, exp)
	}

	return list, nil
}

func (r *DataOperationsRepository) CreateBulkOperation(ctx context.Context, op *models.BulkOperation) error {
	if r.db == nil {
		return nil
	}

	payloadJSON, _ := json.Marshal(op.Payload)

	query := `
		INSERT INTO bulk_operations (
			id, operation_type, target_scope, status, total_target_count, processed_count,
			successful_count, failed_count, payload, requested_by, started_at, completed_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
	`

	_, err := r.db.ExecContext(
		ctx, query,
		op.ID, op.OperationType, op.TargetScope, op.Status, op.TotalTargetCount, op.ProcessedCount,
		op.SuccessfulCount, op.FailedCount, string(payloadJSON), op.RequestedBy, op.StartedAt, op.CompletedAt, op.CreatedAt,
	)

	return err
}

func (r *DataOperationsRepository) ListBulkOperations(ctx context.Context, limit int, offset int) ([]models.BulkOperation, error) {
	if r.db == nil {
		now := time.Now()
		comp := now.Add(-10 * time.Second)
		return []models.BulkOperation{
			{
				ID:               uuid.MustParse("cccc3333-3333-3333-3333-333333333333"),
				OperationType:    models.BulkStatusUpdate,
				TargetScope:      models.ScopeJobs,
				Status:           models.BulkStatusCompleted,
				TotalTargetCount: 15,
				ProcessedCount:   15,
				SuccessfulCount:  15,
				FailedCount:      0,
				Payload:          map[string]interface{}{"status": "Published", "reason": "Mass approval drill"},
				RequestedBy:      uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				StartedAt:        &now,
				CompletedAt:      &comp,
				CreatedAt:        now.Add(-1 * time.Minute),
			},
		}, nil
	}

	query := `
		SELECT id, operation_type, target_scope, status, total_target_count, processed_count,
		       successful_count, failed_count, payload, requested_by, started_at, completed_at, created_at
		FROM bulk_operations
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2;
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.BulkOperation
	for rows.Next() {
		op := models.BulkOperation{}
		var payloadRaw string
		var startedAt, completedAt sql.NullTime

		err := rows.Scan(
			&op.ID, &op.OperationType, &op.TargetScope, &op.Status, &op.TotalTargetCount, &op.ProcessedCount,
			&op.SuccessfulCount, &op.FailedCount, &payloadRaw, &op.RequestedBy, &startedAt, &completedAt, &op.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(payloadRaw), &op.Payload)
		if startedAt.Valid {
			op.StartedAt = &startedAt.Time
		}
		if completedAt.Valid {
			op.CompletedAt = &completedAt.Time
		}
		list = append(list, op)
	}

	return list, nil
}

func (r *DataOperationsRepository) ListDataMigrations(ctx context.Context, limit int, offset int) ([]models.DataMigration, error) {
	if r.db == nil {
		now := time.Now()
		comp := now.Add(-5 * time.Minute)
		return []models.DataMigration{
			{
				ID:                    uuid.MustParse("dddd4444-4444-4444-4444-444444444444"),
				MigrationCode:         "MIG-20260814-PROFILES",
				Title:                 "UserProfile Visibility & Glassmorphism Token Sync",
				Version:               "v1.0",
				Status:                "completed",
				SourceTable:           "profiles",
				TargetTable:           "profiles_v2",
				RecordsMigrated:       14250,
				ReconciliationMatched: true,
				ErrorSummary:          "",
				ExecutedBy:            uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				StartedAt:             now.Add(-6 * time.Minute),
				CompletedAt:           &comp,
				CreatedAt:             now.Add(-10 * time.Minute),
			},
		}, nil
	}

	query := `
		SELECT id, migration_code, title, version, status, source_table, target_table,
		       records_migrated, reconciliation_matched, error_summary, executed_by, started_at, completed_at, created_at
		FROM data_migrations
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2;
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.DataMigration
	for rows.Next() {
		mig := models.DataMigration{}
		var completedAt sql.NullTime

		err := rows.Scan(
			&mig.ID, &mig.MigrationCode, &mig.Title, &mig.Version, &mig.Status, &mig.SourceTable, &mig.TargetTable,
			&mig.RecordsMigrated, &mig.ReconciliationMatched, &mig.ErrorSummary, &mig.ExecutedBy, &mig.StartedAt, &completedAt, &mig.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		if completedAt.Valid {
			mig.CompletedAt = &completedAt.Time
		}
		list = append(list, mig)
	}

	return list, nil
}
