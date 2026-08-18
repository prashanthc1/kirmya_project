package service_test

import (
	"context"
	"errors"
	"testing"

	"kirmya/internal/compliance/domain"
	"kirmya/internal/compliance/repository"
	"kirmya/internal/compliance/service"

	"github.com/google/uuid"
)

func setupTestService() (service.ComplianceService, repository.ComplianceRepository) {
	repo := repository.NewComplianceRepository(nil)
	svc := service.NewComplianceService(repo)
	return svc, repo
}

func TestUpdateConsentAndGetConsents(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()
	userID := uuid.New()

	payload := domain.UpdateConsentPayload{
		ConsentType: domain.ConsentAnalytics,
		IsGranted:   true,
	}

	err := svc.UpdateConsent(ctx, userID, payload, "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error updating consent, got: %v", err)
	}

	consents, err := svc.GetUserConsents(ctx, userID)
	if err != nil {
		t.Fatalf("expected no error fetching consents, got: %v", err)
	}

	if len(consents) == 0 {
		t.Fatalf("expected at least 1 consent record, got 0")
	}

	found := false
	for _, c := range consents {
		if c.ConsentType == domain.ConsentAnalytics && c.IsGranted {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("expected analytics consent to be granted for user %s", userID)
	}
}

func TestGenerateDataExportPackage_Sanitization(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()
	userID := uuid.New()

	pkg, err := svc.GenerateDataExportPackage(ctx, userID)
	if err != nil {
		t.Fatalf("expected no error generating data export package, got: %v", err)
	}

	if pkg.UserID != userID {
		t.Errorf("expected package UserID %s, got %s", userID, pkg.UserID)
	}

	// Verify sensitive credentials are strictly excluded
	forbiddenKeys := []string{"password_hash", "mfa_secret", "totp_key", "api_key", "internal_audit_key"}
	for _, key := range forbiddenKeys {
		if val, exists := pkg.UserProfile[key]; exists {
			t.Errorf("SECURITY BREACH: export package contains sensitive credential key %q with value %v", key, val)
		}
	}

	// Verify required non-sensitive fields are present
	if _, exists := pkg.UserProfile["email"]; !exists {
		t.Errorf("expected email field in user profile export")
	}
}

func TestRequestAccountDeletion_LegalHoldShielding(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()
	userID := uuid.New()

	// 1. Request account deletion without active legal hold -> Should succeed
	req, err := svc.RequestAccountDeletion(ctx, userID)
	if err != nil {
		t.Fatalf("expected deletion request to succeed when no legal hold active, got: %v", err)
	}
	if req.Status != domain.RequestStatusPending {
		t.Errorf("expected pending status for deletion request, got %s", req.Status)
	}

	// 2. Place active Legal Hold on user
	heldUser := uuid.New()
	_, err = svc.CreateLegalHold(ctx, domain.CreateLegalHoldPayload{
		UserID:        heldUser,
		Reason:        "Active litigation investigation #2026-LAW-99",
		ReferenceCase: "CASE-9901",
	})
	if err != nil {
		t.Fatalf("expected no error creating legal hold, got: %v", err)
	}

	// 3. Attempt account deletion on user under legal hold -> MUST return ErrUserUnderLegalHold
	_, err = svc.RequestAccountDeletion(ctx, heldUser)
	if err == nil {
		t.Fatalf("expected account deletion to be BLOCKED for user under legal hold, but got no error")
	}

	if !errors.Is(err, domain.ErrUserUnderLegalHold) {
		t.Errorf("expected ErrUserUnderLegalHold, got: %v", err)
	}
}

func TestRunRetention_DryRunAndExecution(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()

	// Dry-run mode
	dryResult, err := svc.RunRetention(ctx, domain.RunRetentionPayload{
		DataDomain: "job_applications",
		DryRun:     true,
	})
	if err != nil {
		t.Fatalf("expected no error running retention dry-run, got: %v", err)
	}

	if dryResult.DataDomain != "job_applications" {
		t.Errorf("expected data domain job_applications, got %s", dryResult.DataDomain)
	}

	if dryResult.PurgeableCount <= 0 {
		t.Errorf("expected purgeable count > 0 in dry-run, got %d", dryResult.PurgeableCount)
	}

	// Live execution mode
	liveResult, err := svc.RunRetention(ctx, domain.RunRetentionPayload{
		DataDomain: "search_history",
		DryRun:     false,
	})
	if err != nil {
		t.Fatalf("expected no error running live retention, got: %v", err)
	}

	if liveResult.ExecutedAt.IsZero() {
		t.Errorf("expected valid ExecutedAt timestamp in live retention result")
	}
}

func TestAccessReviewsAndDataQualityChecks(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()

	// Access review
	review, err := svc.CreateAccessReview(ctx, domain.CreateAccessReviewPayload{
		TargetUserID: uuid.New(),
		RoleReviewed: "platform_administrator",
		Decision:     "approved",
		Comments:     "Quarterly security access audit completed",
	})
	if err != nil {
		t.Fatalf("expected no error creating access review, got: %v", err)
	}
	if review.Decision != "approved" {
		t.Errorf("expected decision approved, got %s", review.Decision)
	}

	reviews, err := svc.GetAccessReviews(ctx)
	if err != nil || len(reviews) == 0 {
		t.Fatalf("expected non-empty access reviews list")
	}

	// Data quality check
	check, err := svc.RunQualityCheck(ctx, "Candidate Resume Schema Adherence", "resumes")
	if err != nil {
		t.Fatalf("expected no error running quality check, got: %v", err)
	}
	if check.Status != "passed" {
		t.Errorf("expected status passed, got %s", check.Status)
	}
}

func TestPrivacyRiskAndComplianceOverview(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()

	risk, err := svc.GetPrivacyRiskSummary(ctx)
	if err != nil {
		t.Fatalf("expected no error getting privacy risk summary, got: %v", err)
	}

	if risk.OverallRiskScore < 0 || risk.OverallRiskScore > 100 {
		t.Errorf("expected risk score between 0 and 100, got %f", risk.OverallRiskScore)
	}

	overview, err := svc.GetComplianceOverview(ctx)
	if err != nil {
		t.Fatalf("expected no error getting compliance overview, got: %v", err)
	}

	if !overview.GDPRCompliant || !overview.CCPACompliant {
		t.Errorf("expected GDPR & CCPA compliance flags true in overview")
	}
}
