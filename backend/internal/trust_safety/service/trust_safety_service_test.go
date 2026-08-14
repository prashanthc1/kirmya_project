package service

import (
	"context"
	"strings"
	"testing"

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

type mockDeduplicationRepo struct {
	repository.TrustSafetyRepository
	isDuplicate    bool
	deactivatedIDs []uuid.UUID
	restrictions   []models.UserRestriction
	appeal         *models.SafetyAppeal
}

func (m *mockDeduplicationRepo) CheckReportDeduplication(ctx context.Context, reporterID uuid.UUID, targetType string, targetID uuid.UUID, category string) (bool, error) {
	return m.isDuplicate, nil
}

func (m *mockDeduplicationRepo) GetUserActiveRestrictions(ctx context.Context, userID uuid.UUID) ([]models.UserRestriction, error) {
	if m.restrictions != nil {
		return m.restrictions, nil
	}
	return []models.UserRestriction{}, nil
}

func (m *mockDeduplicationRepo) DeactivateRestriction(ctx context.Context, restrictionID uuid.UUID) error {
	m.deactivatedIDs = append(m.deactivatedIDs, restrictionID)
	return nil
}

func (m *mockDeduplicationRepo) GetAppealByID(ctx context.Context, id uuid.UUID) (*models.SafetyAppeal, error) {
	if m.appeal != nil {
		return m.appeal, nil
	}
	return &models.SafetyAppeal{ID: id, UserID: uuid.New(), Status: "approved"}, nil
}

func TestReportDeduplication(t *testing.T) {
	ctx := context.Background()
	baseRepo := repository.NewTrustSafetyRepository(nil)
	mockRepo := &mockDeduplicationRepo{TrustSafetyRepository: baseRepo, isDuplicate: true}
	svc := NewTrustSafetyService(mockRepo)

	_, err := svc.SubmitReport(ctx, uuid.New(), "job", uuid.New(), "Scam Job", "fake_job", "Wire transfer request", nil)
	if err == nil {
		t.Fatalf("expected duplicate report error, got nil")
	}
}

func TestClaimAndAssignCase(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)

	caseID := uuid.New()
	adminID := uuid.New()

	if err := svc.ClaimCase(ctx, caseID, adminID); err != nil {
		t.Fatalf("unexpected error claiming case: %v", err)
	}

	if err := svc.AssignCase(ctx, caseID, adminID, "Fraud Team"); err != nil {
		t.Fatalf("unexpected error assigning case: %v", err)
	}
}

func TestGetUserActiveRestrictions(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewTrustSafetyRepository(nil)
	svc := NewTrustSafetyService(repo)

	userID := uuid.New()
	restrictions, err := svc.GetUserActiveRestrictions(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if restrictions == nil {
		t.Errorf("expected non-nil restrictions slice")
	}
}

func TestResolveAppealApprovedLiftsRestrictions(t *testing.T) {
	ctx := context.Background()
	baseRepo := repository.NewTrustSafetyRepository(nil)

	rID1 := uuid.New()
	rID2 := uuid.New()
	userID := uuid.New()
	appealID := uuid.New()

	mockRepo := &mockDeduplicationRepo{
		TrustSafetyRepository: baseRepo,
		restrictions: []models.UserRestriction{
			{ID: rID1, UserID: userID, IsActive: true},
			{ID: rID2, UserID: userID, IsActive: true},
		},
		appeal: &models.SafetyAppeal{
			ID:     appealID,
			UserID: userID,
			Status: "approved",
		},
	}
	svc := NewTrustSafetyService(mockRepo)

	err := svc.ResolveAppeal(ctx, appealID, uuid.New(), "approved", "Approved upon review")
	if err != nil {
		t.Fatalf("unexpected error resolving appeal: %v", err)
	}

	if len(mockRepo.deactivatedIDs) != 2 {
		t.Errorf("expected 2 restrictions deactivated, got %d", len(mockRepo.deactivatedIDs))
	}
}
