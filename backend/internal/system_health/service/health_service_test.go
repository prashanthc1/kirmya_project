package service

import (
	"context"
	"testing"

	"kirmya/internal/system_health/models"
	"kirmya/internal/system_health/repository"

	"github.com/google/uuid"
)

func TestSystemHealthService_HealthProbesAndDiagnostics(t *testing.T) {
	repo := repository.NewHealthRepository(nil)
	svc := NewSystemHealthService(repo, nil)

	ctx := context.Background()
	adminID := uuid.New()

	// Test 1: Public Liveness Probe
	liveness := svc.GetPublicLiveness()
	if liveness.Status != "healthy" {
		t.Errorf("expected liveness status healthy, got %s", liveness.Status)
	}

	// Test 2: Public Readiness Probe
	readiness := svc.GetPublicReadiness(ctx)
	if readiness.Status != "healthy" {
		t.Errorf("expected readiness status healthy, got %s", readiness.Status)
	}

	// Test 3: Detailed Health Check
	summary, err := svc.GetDetailedHealth(ctx)
	if err != nil {
		t.Fatalf("expected no error checking detailed health, got %v", err)
	}
	if summary.Status != models.StatusHealthy {
		t.Errorf("expected overall status healthy, got %s", summary.Status)
	}
	if len(summary.Components) < 5 {
		t.Errorf("expected at least 5 component health probes, got %d", len(summary.Components))
	}

	// Test 4: Execute Self-Healing Recovery Action
	action, err := svc.ExecuteSelfHealingAction(ctx, adminID, "restart_worker", "workers")
	if err != nil {
		t.Fatalf("expected no error executing self-healing action, got %v", err)
	}
	if action.Status != "completed" {
		t.Errorf("expected completed action status, got %s", action.Status)
	}

	// Test 5: Toggle Maintenance Mode
	mMode, err := svc.ToggleMaintenanceMode(ctx, adminID, models.ToggleMaintenanceRequest{
		Enable:          true,
		Reason:          "Scheduled platform upgrade drill",
		AllowedAdminIDs: []string{adminID.String()},
	})
	if err != nil {
		t.Fatalf("expected no error toggling maintenance mode, got %v", err)
	}
	if !mMode.IsEnabled {
		t.Errorf("expected maintenance mode to be enabled")
	}

	// Test 6: Generate Diagnostic Report
	report, err := svc.GenerateDiagnosticReport(ctx, adminID)
	if err != nil {
		t.Fatalf("expected no error generating diagnostic report, got %v", err)
	}
	if report.ReportID == "" {
		t.Errorf("expected valid report ID")
	}
}
