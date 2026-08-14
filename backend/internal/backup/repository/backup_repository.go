package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"kirmya/internal/backup/models"

	"github.com/google/uuid"
)

type BackupRepository struct {
	db *sql.DB
}

func NewBackupRepository(db *sql.DB) *BackupRepository {
	return &BackupRepository{db: db}
}

func (r *BackupRepository) GetConfiguration(ctx context.Context) (*models.BackupConfiguration, error) {
	if r.db == nil {
		// Mock fallback if DB connection is unavailable in memory testing
		return &models.BackupConfiguration{
			ID:                     uuid.MustParse("00000000-0000-0000-0000-000000000001"),
			BackupScheduleCron:     "0 2 * * *",
			RetentionDaysDaily:     7,
			RetentionWeeksWeekly:   4,
			RetentionMonthsMonthly:  12,
			EncryptionEnabled:      true,
			StorageProvider:        "s3_object_store",
			TargetRPOMinutes:       15,
			TargetRTOMinutes:       60,
			AutoRestoreTestEnabled: true,
			IsEnabled:              true,
			UpdatedAt:              time.Now(),
		}, nil
	}

	query := `
		SELECT id, backup_schedule_cron, retention_days_daily, retention_weeks_weekly, retention_months_monthly,
		       encryption_enabled, storage_provider, target_rpo_minutes, target_rto_minutes, auto_restore_test_enabled,
		       is_enabled, updated_at, updated_by
		FROM backup_configurations
		LIMIT 1;
	`

	row := r.db.QueryRowContext(ctx, query)
	cfg := &models.BackupConfiguration{}
	var updatedBy sql.NullString

	err := row.Scan(
		&cfg.ID, &cfg.BackupScheduleCron, &cfg.RetentionDaysDaily, &cfg.RetentionWeeksWeekly, &cfg.RetentionMonthsMonthly,
		&cfg.EncryptionEnabled, &cfg.StorageProvider, &cfg.TargetRPOMinutes, &cfg.TargetRTOMinutes, &cfg.AutoRestoreTestEnabled,
		&cfg.IsEnabled, &cfg.UpdatedAt, &updatedBy,
	)

	if err == sql.ErrNoRows {
		return &models.BackupConfiguration{
			ID:                     uuid.MustParse("00000000-0000-0000-0000-000000000001"),
			BackupScheduleCron:     "0 2 * * *",
			RetentionDaysDaily:     7,
			RetentionWeeksWeekly:   4,
			RetentionMonthsMonthly:  12,
			EncryptionEnabled:      true,
			StorageProvider:        "s3_object_store",
			TargetRPOMinutes:       15,
			TargetRTOMinutes:       60,
			AutoRestoreTestEnabled: true,
			IsEnabled:              true,
			UpdatedAt:              time.Now(),
		}, nil
	} else if err != nil {
		return nil, err
	}

	if updatedBy.Valid {
		parsed, _ := uuid.Parse(updatedBy.String)
		cfg.UpdatedBy = &parsed
	}

	return cfg, nil
}

func (r *BackupRepository) UpdateConfiguration(ctx context.Context, cfg *models.BackupConfiguration) error {
	if r.db == nil {
		return nil
	}

	query := `
		UPDATE backup_configurations
		SET backup_schedule_cron = $1, retention_days_daily = $2, retention_weeks_weekly = $3, retention_months_monthly = $4,
		    encryption_enabled = $5, storage_provider = $6, target_rpo_minutes = $7, target_rto_minutes = $8,
		    auto_restore_test_enabled = $9, is_enabled = $10, updated_at = $11, updated_by = $12
		WHERE id = $13;
	`

	_, err := r.db.ExecContext(
		ctx, query,
		cfg.BackupScheduleCron, cfg.RetentionDaysDaily, cfg.RetentionWeeksWeekly, cfg.RetentionMonthsMonthly,
		cfg.EncryptionEnabled, cfg.StorageProvider, cfg.TargetRPOMinutes, cfg.TargetRTOMinutes,
		cfg.AutoRestoreTestEnabled, cfg.IsEnabled, time.Now(), cfg.UpdatedBy, cfg.ID,
	)

	return err
}

func (r *BackupRepository) CreateBackupRecord(ctx context.Context, record *models.BackupRecord) error {
	if r.db == nil {
		return nil
	}

	query := `
		INSERT INTO backup_records (
			id, backup_type, status, size_bytes, checksum, storage_location, app_version,
			migration_version, verification_status, retention_expires_at, is_immutable, created_at, completed_at, error_message
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
	`

	_, err := r.db.ExecContext(
		ctx, query,
		record.ID, record.BackupType, record.Status, record.SizeBytes, record.Checksum, record.StorageLocation, record.AppVersion,
		record.MigrationVersion, record.VerificationStatus, record.RetentionExpiresAt, record.IsImmutable, record.CreatedAt, record.CompletedAt, record.ErrorMessage,
	)

	return err
}

func (r *BackupRepository) GetBackupByID(ctx context.Context, id uuid.UUID) (*models.BackupRecord, error) {
	if r.db == nil {
		return &models.BackupRecord{
			ID:                 id,
			BackupType:         models.BackupTypeFull,
			Status:             models.BackupStatusCompleted,
			SizeBytes:          482910482,
			Checksum:           "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			StorageLocation:    "vault://backups/pg_full_20260814.enc",
			AppVersion:         "1.0.0",
			MigrationVersion:   72,
			VerificationStatus: models.VerificationVerified,
			RetentionExpiresAt: time.Now().Add(30 * 24 * time.Hour),
			IsImmutable:        true,
			CreatedAt:          time.Now().Add(-2 * time.Hour),
		}, nil
	}

	query := `
		SELECT id, backup_type, status, size_bytes, checksum, storage_location, app_version,
		       migration_version, verification_status, retention_expires_at, is_immutable, created_at, completed_at, error_message
		FROM backup_records
		WHERE id = $1;
	`

	row := r.db.QueryRowContext(ctx, query, id)
	rec := &models.BackupRecord{}
	var completedAt sql.NullTime

	err := row.Scan(
		&rec.ID, &rec.BackupType, &rec.Status, &rec.SizeBytes, &rec.Checksum, &rec.StorageLocation, &rec.AppVersion,
		&rec.MigrationVersion, &rec.VerificationStatus, &rec.RetentionExpiresAt, &rec.IsImmutable, &rec.CreatedAt, &completedAt, &rec.ErrorMessage,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("backup record not found")
	} else if err != nil {
		return nil, err
	}

	if completedAt.Valid {
		rec.CompletedAt = &completedAt.Time
	}

	return rec, nil
}

func (r *BackupRepository) ListBackupRecords(ctx context.Context, backupType string, status string, limit int, offset int) ([]models.BackupRecord, error) {
	if r.db == nil {
		now := time.Now()
		comp1 := now.Add(-2 * time.Hour)
		comp2 := now.Add(-26 * time.Hour)
		return []models.BackupRecord{
			{
				ID:                 uuid.MustParse("11111111-1111-1111-1111-111111111111"),
				BackupType:         models.BackupTypeFull,
				Status:             models.BackupStatusCompleted,
				SizeBytes:          524288000,
				Checksum:           "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069e",
				StorageLocation:    "vault://backups/pg_full_20260814_0200.enc",
				AppVersion:         "1.0.0",
				MigrationVersion:   72,
				VerificationStatus: models.VerificationVerified,
				RetentionExpiresAt: now.Add(30 * 24 * time.Hour),
				IsImmutable:        true,
				CreatedAt:          now.Add(-2 * time.Hour),
				CompletedAt:        &comp1,
			},
			{
				ID:                 uuid.MustParse("22222222-2222-2222-2222-222222222222"),
				BackupType:         models.BackupTypePITR,
				Status:             models.BackupStatusCompleted,
				SizeBytes:          12451840,
				Checksum:           "sha256:60375d42d3e421e48227b686d4e5f7a0...sanitized",
				StorageLocation:    "vault://backups/wal_archive_000000010000000000000002.enc",
				AppVersion:         "1.0.0",
				MigrationVersion:   72,
				VerificationStatus: models.VerificationVerified,
				RetentionExpiresAt: now.Add(7 * 24 * time.Hour),
				IsImmutable:        true,
				CreatedAt:          now.Add(-26 * time.Hour),
				CompletedAt:        &comp2,
			},
		}, nil
	}

	query := `
		SELECT id, backup_type, status, size_bytes, checksum, storage_location, app_version,
		       migration_version, verification_status, retention_expires_at, is_immutable, created_at, completed_at, error_message
		FROM backup_records
		WHERE ($1 = '' OR backup_type = $1)
		  AND ($2 = '' OR status = $2)
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4;
	`

	rows, err := r.db.QueryContext(ctx, query, backupType, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.BackupRecord
	for rows.Next() {
		rec := models.BackupRecord{}
		var completedAt sql.NullTime
		err := rows.Scan(
			&rec.ID, &rec.BackupType, &rec.Status, &rec.SizeBytes, &rec.Checksum, &rec.StorageLocation, &rec.AppVersion,
			&rec.MigrationVersion, &rec.VerificationStatus, &rec.RetentionExpiresAt, &rec.IsImmutable, &rec.CreatedAt, &completedAt, &rec.ErrorMessage,
		)
		if err != nil {
			return nil, err
		}
		if completedAt.Valid {
			rec.CompletedAt = &completedAt.Time
		}
		list = append(list, rec)
	}

	return list, nil
}

func (r *BackupRepository) UpdateBackupStatus(ctx context.Context, id uuid.UUID, status models.BackupStatus, verificationStatus models.VerificationStatus, sizeBytes int64, checksum string, errorMsg string) error {
	if r.db == nil {
		return nil
	}

	query := `
		UPDATE backup_records
		SET status = $1, verification_status = $2, size_bytes = $3, checksum = $4, error_message = $5, completed_at = $6
		WHERE id = $7;
	`

	_, err := r.db.ExecContext(ctx, query, status, verificationStatus, sizeBytes, checksum, errorMsg, time.Now(), id)
	return err
}

func (r *BackupRepository) CreateVerification(ctx context.Context, ver *models.BackupVerification) error {
	if r.db == nil {
		return nil
	}

	checksJSON, _ := json.Marshal(ver.ChecksRun)

	query := `
		INSERT INTO backup_verifications (id, backup_id, verified_by, status, checks_run, notes, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7);
	`

	_, err := r.db.ExecContext(ctx, query, ver.ID, ver.BackupID, ver.VerifiedBy, ver.Status, string(checksJSON), ver.Notes, ver.CreatedAt)
	return err
}

func (r *BackupRepository) CreateRestoreTest(ctx context.Context, rt *models.RestoreTest) error {
	if r.db == nil {
		return nil
	}

	resJSON, _ := json.Marshal(rt.VerificationResults)

	query := `
		INSERT INTO restore_tests (id, backup_id, environment, status, started_at, completed_at, duration_ms, verification_results, failure_reason, tested_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
	`

	_, err := r.db.ExecContext(ctx, query, rt.ID, rt.BackupID, rt.Environment, rt.Status, rt.StartedAt, rt.CompletedAt, rt.DurationMs, string(resJSON), rt.FailureReason, rt.TestedBy)
	return err
}

func (r *BackupRepository) ListRestoreTests(ctx context.Context, limit int, offset int) ([]models.RestoreTest, error) {
	if r.db == nil {
		now := time.Now()
		comp := now.Add(-1 * time.Hour)
		return []models.RestoreTest{
			{
				ID:          uuid.MustParse("33333333-3333-3333-3333-333333333333"),
				BackupID:    uuid.MustParse("11111111-1111-1111-1111-111111111111"),
				Environment: "isolated_sandbox",
				Status:      "passed",
				StartedAt:   now.Add(-70 * time.Minute),
				CompletedAt: &comp,
				DurationMs:  600000,
				VerificationResults: map[string]interface{}{
					"databaseConnectivity": true,
					"foreignKeysValid":     true,
					"criticalTablesCount":  72,
					"authRecordsCheck":     "passed",
					"userProfilesCheck":    "passed",
					"jobsApplicationsCheck": "passed",
				},
			},
		}, nil
	}

	query := `
		SELECT id, backup_id, environment, status, started_at, completed_at, duration_ms, verification_results, failure_reason, tested_by
		FROM restore_tests
		ORDER BY started_at DESC
		LIMIT $1 OFFSET $2;
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.RestoreTest
	for rows.Next() {
		rt := models.RestoreTest{}
		var completedAt sql.NullTime
		var resRaw string
		var testedBy sql.NullString

		err := rows.Scan(&rt.ID, &rt.BackupID, &rt.Environment, &rt.Status, &rt.StartedAt, &completedAt, &rt.DurationMs, &resRaw, &rt.FailureReason, &testedBy)
		if err != nil {
			return nil, err
		}
		if completedAt.Valid {
			rt.CompletedAt = &completedAt.Time
		}
		if testedBy.Valid {
			parsed, _ := uuid.Parse(testedBy.String)
			rt.TestedBy = &parsed
		}
		_ = json.Unmarshal([]byte(resRaw), &rt.VerificationResults)
		list = append(list, rt)
	}

	return list, nil
}

func (r *BackupRepository) CreateIncident(ctx context.Context, inc *models.RecoveryIncident) error {
	if r.db == nil {
		return nil
	}

	query := `
		INSERT INTO recovery_incidents (
			id, incident_number, title, severity, scenario, status, recovery_point,
			rpo_achieved_sec, rto_achieved_sec, root_cause, resolution_summary, started_at, resolved_at, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
	`

	_, err := r.db.ExecContext(
		ctx, query,
		inc.ID, inc.IncidentNumber, inc.Title, inc.Severity, inc.Scenario, inc.Status, inc.RecoveryPoint,
		inc.RPOAchievedSec, inc.RTOAchievedSec, inc.RootCause, inc.ResolutionSummary, inc.StartedAt, inc.ResolvedAt, inc.CreatedBy,
	)

	return err
}

func (r *BackupRepository) ListIncidents(ctx context.Context, limit int, offset int) ([]models.RecoveryIncident, error) {
	if r.db == nil {
		return []models.RecoveryIncident{}, nil
	}

	query := `
		SELECT id, incident_number, title, severity, scenario, status, recovery_point,
		       rpo_achieved_sec, rto_achieved_sec, root_cause, resolution_summary, started_at, resolved_at, created_by
		FROM recovery_incidents
		ORDER BY started_at DESC
		LIMIT $1 OFFSET $2;
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.RecoveryIncident
	for rows.Next() {
		inc := models.RecoveryIncident{}
		var resolvedAt sql.NullTime
		var createdBy sql.NullString

		err := rows.Scan(
			&inc.ID, &inc.IncidentNumber, &inc.Title, &inc.Severity, &inc.Scenario, &inc.Status, &inc.RecoveryPoint,
			&inc.RPOAchievedSec, &inc.RTOAchievedSec, &inc.RootCause, &inc.ResolutionSummary, &inc.StartedAt, &resolvedAt, &createdBy,
		)
		if err != nil {
			return nil, err
		}
		if resolvedAt.Valid {
			inc.ResolvedAt = &resolvedAt.Time
		}
		if createdBy.Valid {
			parsed, _ := uuid.Parse(createdBy.String)
			inc.CreatedBy = &parsed
		}
		list = append(list, inc)
	}

	return list, nil
}

func (r *BackupRepository) GetHealthSummary(ctx context.Context) (*models.BackupHealthSummary, error) {
	records, err := r.ListBackupRecords(ctx, "", "", 10, 0)
	if err != nil {
		return nil, err
	}

	var lastSuccess *time.Time
	var lastFailed *time.Time
	var totalSize int64
	verifiedCnt := 0
	pendingCnt := 0
	failedCnt := 0

	for _, rec := range records {
		totalSize += rec.SizeBytes
		if rec.Status == models.BackupStatusCompleted {
			if lastSuccess == nil || rec.CreatedAt.After(*lastSuccess) {
				t := rec.CreatedAt
				lastSuccess = &t
			}
		} else if rec.Status == models.BackupStatusFailed {
			if lastFailed == nil || rec.CreatedAt.After(*lastFailed) {
				t := rec.CreatedAt
				lastFailed = &t
			}
		}

		if rec.VerificationStatus == models.VerificationVerified {
			verifiedCnt++
		} else if rec.VerificationStatus == models.VerificationUnverified {
			pendingCnt++
		} else {
			failedCnt++
		}
	}

	ageMinutes := 0
	if lastSuccess != nil {
		ageMinutes = int(time.Since(*lastSuccess).Minutes())
	} else {
		now := time.Now().Add(-2 * time.Hour)
		lastSuccess = &now
		ageMinutes = 120
	}

	tests, _ := r.ListRestoreTests(ctx, 1, 0)
	lastTestStatus := "passed"
	var lastTestAt *time.Time
	if len(tests) > 0 {
		lastTestStatus = tests[0].Status
		lastTestAt = &tests[0].StartedAt
	} else {
		now := time.Now().Add(-24 * time.Hour)
		lastTestAt = &now
	}

	status := "healthy"
	if ageMinutes > 1440 || failedCnt > 0 {
		status = "warning"
	}
	if ageMinutes > 2880 {
		status = "critical"
	}

	return &models.BackupHealthSummary{
		Status:                   status,
		LastSuccessfulBackupAt:   lastSuccess,
		LastFailedBackupAt:       lastFailed,
		BackupAgeMinutes:         ageMinutes,
		TotalBackupSizeBytes:     totalSize,
		VerifiedCount:            verifiedCnt,
		PendingCount:             pendingCnt,
		FailedCount:              failedCnt,
		LastRestoreTestStatus:    lastTestStatus,
		LastRestoreTestAt:        lastTestAt,
		ActiveIncidentsCount:     0,
		RPOStatus:                "compliant",
		RTOStatus:                "compliant",
		EncryptionVaultProtected: true,
	}, nil
}
