package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/trust_safety/models"
	"kirmya/internal/trust_safety/repository"
)

func TestTrustSafetyService(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)
	ctx := context.Background()

	t.Run("SubmitReport creates safety report with linked case", func(t *testing.T) {
		report, err := svc.SubmitReport(ctx, uuid.New(), "job", uuid.New(), "Software Engineer", "fake_job", "Advance payment request", nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if report.Category != "fake_job" {
			t.Errorf("expected category 'fake_job', got '%s'", report.Category)
		}
	})

	t.Run("EvaluateJobScamRisk detects wire transfer scam triggers", func(t *testing.T) {
		score, triggers := svc.EvaluateJobScamRisk(ctx, "Data Entry Specialist", "Please send wire transfer pay fee before starting work.", "$5000/week")
		if score < 50.0 {
			t.Errorf("expected high risk score, got %f", score)
		}
		if triggers == "" {
			t.Errorf("expected scam triggers to be populated")
		}
	})

	t.Run("ApplyModerationAction requires human moderator for permanent suspension", func(t *testing.T) {
		_, err := svc.ApplyModerationAction(ctx, uuid.New(), uuid.Nil, "permanent_suspension", "Permanent Suspension", "Severe violation", 0)
		if err == nil {
			t.Fatalf("expected error when adminID is nil for permanent suspension, got nil")
		}
	})

	t.Run("MuteEntity records mute duration", func(t *testing.T) {
		err := svc.MuteEntity(ctx, uuid.New(), "user", uuid.New(), 7)
		if err != nil {
			t.Fatalf("unexpected error muting user: %v", err)
		}
	})

	t.Run("SubmitAppeal creates appeal record", func(t *testing.T) {
		appeal, err := svc.SubmitAppeal(ctx, uuid.New(), uuid.New(), "False Flag", "Documentation provided", nil)
		if err != nil {
			t.Fatalf("unexpected error submitting appeal: %v", err)
		}
		if appeal.Status != "submitted" {
			t.Errorf("expected status 'submitted', got '%s'", appeal.Status)
		}
	})

	t.Run("GetSafetyMetricsSummary returns aggregate summary", func(t *testing.T) {
		summary, err := svc.GetSafetyMetricsSummary(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if summary.OpenReports < 0 {
			t.Errorf("invalid open reports count: %d", summary.OpenReports)
		}
	})
}

func TestSanitizeDescription(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)

	dirty := "  <script>alert('xss')</script><iframe></iframe><style>body{}</style><a href='#'>Link</a> Clean text  "
	sanitized := svc.SanitizeDescription(dirty)
	if strings.Contains(sanitized, "<script>") || strings.Contains(sanitized, "<iframe>") || strings.Contains(sanitized, "<style>") || strings.Contains(sanitized, "<a>") {
		t.Errorf("expected HTML tags to be stripped, got: %s", sanitized)
	}
	if !strings.Contains(sanitized, "Clean text") {
		t.Errorf("expected 'Clean text' to remain, got: %s", sanitized)
	}

	var sb strings.Builder
	for i := 0; i < 5000; i++ {
		sb.WriteString("a")
	}
	sanitizedLong := svc.SanitizeDescription(sb.String())
	if len([]rune(sanitizedLong)) != 4000 {
		t.Errorf("expected max length 4000, got %d", len([]rune(sanitizedLong)))
	}
}

func TestReporterPrivacyRedaction(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)

	reporterID := uuid.New()
	report := &models.SafetyReport{
		ID:              uuid.New(),
		ReporterID:      reporterID,
		TargetType:      "job",
		TargetID:        uuid.New(),
		Category:        "spam",
		Description:     "Spam post",
		ResolutionNotes: "Internal sensitive note",
	}

	redacted := svc.RedactReporterIdentity(report)
	if redacted.ReporterID != uuid.Nil {
		t.Errorf("expected ReporterID to be redacted to uuid.Nil, got %s", redacted.ReporterID)
	}
	if redacted.ResolutionNotes != "" {
		t.Errorf("expected ResolutionNotes to be cleared, got '%s'", redacted.ResolutionNotes)
	}
}

func TestAutomatedContentModeration(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)
	ctx := context.Background()

	conf, reasons, flagged := svc.EvaluateContentModeration(ctx, "text", "Please click http://bit.ly/scam and send wire transfer Crypto deposit", nil)
	if conf < 0.50 {
		t.Errorf("expected confidence score >= 0.50, got %f", conf)
	}
	if !flagged {
		t.Errorf("expected content to be flagged")
	}
	if len(reasons) < 2 {
		t.Errorf("expected multiple trigger reasons, got %v", reasons)
	}
}

func TestAppealReviewerIndependenceConstraint(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)
	ctx := context.Background()

	originalModeratorID := uuid.New()
	caseID := uuid.New()

	decision, err := svc.ApplyModerationDecision(ctx, caseID, originalModeratorID, "messaging_restriction", "Messaging Restriction", "Spam", "1.0.0", 7)
	if err != nil {
		t.Fatalf("unexpected error creating decision: %v", err)
	}

	userID := uuid.New()
	appeal, err := svc.SubmitAppeal(ctx, decision.ID, userID, "False Flag", "I did not send spam", nil)
	if err != nil {
		t.Fatalf("unexpected error submitting appeal: %v", err)
	}

	// Original moderator trying to resolve appeal should fail
	err = svc.ResolveAppeal(ctx, appeal.ID, originalModeratorID, "approved", "Approved by original mod")
	if err == nil {
		t.Fatalf("expected error when original moderator resolves appeal, got nil")
	}
	if !strings.Contains(err.Error(), "INDEPENDENT_REVIEWER_REQUIRED") {
		t.Errorf("expected INDEPENDENT_REVIEWER_REQUIRED error, got %v", err)
	}

	// Independent reviewer resolving appeal should succeed
	independentReviewerID := uuid.New()
	err = svc.ResolveAppeal(ctx, appeal.ID, independentReviewerID, "approved", "Approved by independent reviewer")
	if err != nil {
		t.Fatalf("unexpected error when independent reviewer resolves appeal: %v", err)
	}
}

func TestPolicyVersioningAndCRUD(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)
	ctx := context.Background()

	policy, err := svc.CreateSafetyPolicy(ctx, models.CreatePolicyPayload{
		Code:                "POL-TEST-001",
		Title:               "Test Safety Policy",
		Category:            "spam",
		Description:         "Test policy description",
		Severity:            "high",
		EnforcementGuidance: "Issue warning",
		Version:             "1.0.0",
	})
	if err != nil {
		t.Fatalf("unexpected error creating policy: %v", err)
	}
	if policy.Version != "1.0.0" {
		t.Errorf("expected policy version '1.0.0', got '%s'", policy.Version)
	}

	updated, err := svc.UpdateSafetyPolicy(ctx, policy.ID, models.UpdatePolicyPayload{
		Version: "1.1.0",
		Title:   "Updated Test Safety Policy",
	})
	if err != nil {
		t.Fatalf("unexpected error updating policy: %v", err)
	}
	if updated.Version != "1.1.0" {
		t.Errorf("expected updated version '1.1.0', got '%s'", updated.Version)
	}
}

func TestCleanExpiredRestrictions(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)
	ctx := context.Background()

	userID := uuid.New()
	expiredTime := time.Now().Add(-1 * time.Hour)
	adminID := uuid.New()

	expiredRestriction := &models.UserRestriction{
		ID:               uuid.New(),
		UserID:           userID,
		RestrictionScope: "messaging",
		Reason:           "Temporary spam lock",
		StartsAt:         time.Now().Add(-24 * time.Hour),
		ExpiresAt:        &expiredTime,
		CreatedBy:        &adminID,
		IsActive:         true,
		CreatedAt:        time.Now().Add(-24 * time.Hour),
	}
	_ = repo.CreateRestriction(ctx, expiredRestriction)

	cleanedCount, err := svc.CleanExpiredRestrictions(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error cleaning expired restrictions: %v", err)
	}
	if cleanedCount != 1 {
		t.Errorf("expected 1 expired restriction cleaned, got %d", cleanedCount)
	}
}

func TestReinstateUser(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)
	ctx := context.Background()

	userID := uuid.New()
	adminID := uuid.New()

	err := svc.ReinstateUser(ctx, adminID, models.ReinstateUserPayload{
		UserID:           userID.String(),
		Reason:           "Identity verified",
		LiftRestrictions: true,
	})
	if err != nil {
		t.Fatalf("unexpected error reinstating user: %v", err)
	}

	rep, err := svc.GetUserReputation(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error fetching reputation: %v", err)
	}
	if rep.Score != 100.0 {
		t.Errorf("expected score 100.0 after reinstatement, got %f", rep.Score)
	}
}

func TestLogEvidenceItemAndWorkloads(t *testing.T) {
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)
	ctx := context.Background()

	caseID := uuid.New()
	item, err := svc.LogEvidenceItem(ctx, &caseID, nil, "system_scan", "log_file", "Suspicious login attempt log")
	if err != nil {
		t.Fatalf("unexpected error logging evidence: %v", err)
	}
	if item.EvidenceType != "log_file" {
		t.Errorf("expected evidence type 'log_file', got '%s'", item.EvidenceType)
	}

	evidenceList, err := svc.GetCaseEvidence(ctx, caseID)
	if err != nil {
		t.Fatalf("unexpected error getting case evidence: %v", err)
	}
	if len(evidenceList) != 1 {
		t.Errorf("expected 1 evidence item, got %d", len(evidenceList))
	}

	workloads, err := svc.GetModeratorWorkloads(ctx)
	if err != nil {
		t.Fatalf("unexpected error getting workloads: %v", err)
	}
	if len(workloads) == 0 {
		t.Errorf("expected workloads slice to be non-empty")
	}
}
