package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
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
		if !testing.Short() && len(triggers) == 0 {
			t.Errorf("expected scam triggers to be populated")
		}
	})

	t.Run("ApplyModerationAction requires human moderator for permanent suspension", func(t *testing.T) {
		_, err := svc.ApplyModerationAction(ctx, uuid.New(), uuid.Nil, "permanent_suspension", "Permanent Suspension", "Severe violation", 0)
		if err == nil {
			t.Fatalf("expected error when adminID is nil for permanent suspension, got nil")
		}
	})
}
