package service

import (
	"context"
	"testing"

	"kirmya/internal/backup/models"
	"kirmya/internal/backup/repository"

	"github.com/google/uuid"
)

func TestBackupService_TriggerAndVerify(t *testing.T) {
	repo := repository.NewBackupRepository(nil)
	svc := NewBackupService(repo)

	adminID := uuid.New()
	ctx := context.Background()

	// Test 1: Get Configuration
	cfg, err := svc.GetConfiguration(ctx)
	if err != nil {
		t.Fatalf("expected no error getting config, got %v", err)
	}
	if !cfg.EncryptionEnabled {
		t.Errorf("expected encryption to be enabled")
	}

	// Test 2: Trigger Backup
	record, err := svc.TriggerBackup(ctx, adminID, models.TriggerBackupRequest{
		BackupType: models.BackupTypeFull,
		Notes:      "Manual test backup trigger",
	})
	if err != nil {
		t.Fatalf("expected no error triggering backup, got %v", err)
	}
	if record.BackupType != models.BackupTypeFull {
		t.Errorf("expected backup type full, got %s", record.BackupType)
	}
	if record.Checksum == "" {
		t.Errorf("expected SHA-256 checksum to be generated")
	}

	// Test 3: Verify Backup
	ver, err := svc.VerifyBackup(ctx, adminID, record.ID)
	if err != nil {
		t.Fatalf("expected no error verifying backup, got %v", err)
	}
	if ver.Status != "passed" {
		t.Errorf("expected verification status passed, got %s", ver.Status)
	}

	// Test 4: Run Restore Test Sandbox
	rt, err := svc.RunRestoreTest(ctx, adminID, models.RunRestoreTestRequest{
		BackupID:    record.ID,
		Environment: "isolated_sandbox",
	})
	if err != nil {
		t.Fatalf("expected no error running restore test, got %v", err)
	}
	if rt.Status != "passed" {
		t.Errorf("expected restore test status passed, got %s", rt.Status)
	}

	// Test 5: Confirm Production Restore invalid confirmation code should fail
	_, err = svc.ConfirmProductionRestore(ctx, adminID, models.ConfirmProductionRestoreRequest{
		BackupID:            record.ID,
		ConfirmationCode:    "WRONG-CODE",
		TargetEnvironment:   "production",
		Reason:              "Testing invalid code rejection",
		AcknowledgeDataLoss: true,
	})
	if err == nil {
		t.Fatalf("expected error for invalid double confirmation code")
	}

	// Test 6: Confirm Production Restore valid confirmation code should succeed
	res, err := svc.ConfirmProductionRestore(ctx, adminID, models.ConfirmProductionRestoreRequest{
		BackupID:            record.ID,
		ConfirmationCode:    "RESTORE-PRODUCTION-DATA",
		TargetEnvironment:   "production",
		Reason:              "Emergency disaster recovery test",
		AcknowledgeDataLoss: true,
	})
	if err != nil {
		t.Fatalf("expected no error for valid confirmation, got %v", err)
	}
	if res["status"] != "pre_restore_snapshot_created" {
		t.Errorf("expected pre_restore_snapshot_created, got %v", res["status"])
	}
}
