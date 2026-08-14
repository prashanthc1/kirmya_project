package service

import (
	"context"
	"testing"

	"kirmya/internal/data_operations/models"
	"kirmya/internal/data_operations/repository"

	"github.com/google/uuid"
)

func TestDataOperationsService_CSVImportAndExport(t *testing.T) {
	repo := repository.NewDataOperationsRepository(nil)
	svc := NewDataOperationsService(repo)

	ctx := context.Background()
	userID := uuid.New()

	// Test 1: Formula Injection Sanitization
	sanitizedEq := svc.SanitizeCSVValue("=SUM(A1:A10)")
	if sanitizedEq != "'=SUM(A1:A10)" {
		t.Errorf("expected '=SUM(A1:A10)', got %s", sanitizedEq)
	}

	sanitizedPlus := svc.SanitizeCSVValue("+12345")
	if sanitizedPlus != "'+12345" {
		t.Errorf("expected '+12345', got %s", sanitizedPlus)
	}

	// Test 2: Preview CSV Import
	csvContent := "Job Title,Company Name,Location,Type\nSenior Go Engineer,Kirmya Corp,Remote,Full-Time\nBackend Developer,Tech Inc,Dubai,Contract"
	preview, err := svc.PreviewImport(ctx, models.PreviewImportRequest{
		ImportType: models.ImportTypeJobs,
		CSVContent: csvContent,
	})
	if err != nil {
		t.Fatalf("expected no error previewing import, got %v", err)
	}
	if preview.TotalRows != 2 {
		t.Errorf("expected 2 total rows, got %d", preview.TotalRows)
	}
	if preview.ValidRowsCount != 2 {
		t.Errorf("expected 2 valid rows, got %d", preview.ValidRowsCount)
	}

	// Test 3: Create Import Job
	imp, err := svc.CreateImport(ctx, userID, models.CreateImportRequest{
		ImportType:       models.ImportTypeJobs,
		Strategy:         models.StrategyCreateOrUpdate,
		OriginalFilename: "jobs_test.csv",
		CSVContent:       csvContent,
	})
	if err != nil {
		t.Fatalf("expected no error creating import, got %v", err)
	}
	if imp.SuccessfulRows != 2 {
		t.Errorf("expected 2 successful rows, got %d", imp.SuccessfulRows)
	}

	// Test 4: Create User Personal Data Export
	userExp, err := svc.CreateUserExport(ctx, userID)
	if err != nil {
		t.Fatalf("expected no error creating user export, got %v", err)
	}
	if userExp.Format != models.ExportFormatZIP {
		t.Errorf("expected zip format, got %s", userExp.Format)
	}
	if userExp.DownloadURL == "" {
		t.Errorf("expected signed download URL")
	}

	// Test 5: Execute Bulk Operation Dry Run
	bulkOp, err := svc.ExecuteBulkOperation(ctx, userID, models.ExecuteBulkOpRequest{
		OperationType: models.BulkStatusUpdate,
		TargetScope:   models.ScopeJobs,
		TargetIDs:     []string{uuid.New().String(), uuid.New().String()},
		ActionPayload: map[string]interface{}{"status": "Archived"},
		IsDryRun:      true,
	})
	if err != nil {
		t.Fatalf("expected no error executing bulk op, got %v", err)
	}
	if bulkOp.Status != models.BulkStatusPreview {
		t.Errorf("expected status preview for dry run, got %s", bulkOp.Status)
	}
}
