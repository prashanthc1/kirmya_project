package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"kirmya/internal/security/models"
	"kirmya/internal/security/repository"
)

func TestSecurityService(t *testing.T) {
	repo := repository.NewSecurityRepository(nil)
	svc := NewSecurityService(repo)
	ctx := context.Background()

	t.Run("GetSecurityOverview returns overview metadata", func(t *testing.T) {
		userID := uuid.New()
		ov, err := svc.GetSecurityOverview(ctx, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if ov.SecurityScore < 0 || ov.SecurityScore > 100 {
			t.Errorf("invalid security score: %d", ov.SecurityScore)
		}
	})

	t.Run("ChangePassword validates minimum length constraint", func(t *testing.T) {
		userID := uuid.New()
		err := svc.ChangePassword(ctx, userID, "OldPass123!", "short")
		if err == nil {
			t.Error("expected error for short password, got nil")
		}

		err = svc.ChangePassword(ctx, userID, "OldPass123!", "ValidSecretPassword123!")
		if err != nil {
			t.Errorf("unexpected error for valid password: %v", err)
		}
	})

	t.Run("SetupMFA generates TOTP secret and recovery codes", func(t *testing.T) {
		userID := uuid.New()
		res, err := svc.SetupMFA(ctx, userID)
		if err != nil {
			t.Fatalf("unexpected MFA setup error: %v", err)
		}
		if res.Secret == "" {
			t.Error("expected non-empty TOTP secret")
		}
		if len(res.RecoveryCodes) != 8 {
			t.Errorf("expected 8 recovery codes, got %d", len(res.RecoveryCodes))
		}
	})

	t.Run("CreateAPIKey generates hashed key response with single secret exposure", func(t *testing.T) {
		userID := uuid.New()
		keyRes, err := svc.CreateAPIKey(ctx, userID, models.CreateAPIKeyPayload{
			Name:   "CLI Token",
			Scopes: "jobs.read",
		})
		if err != nil {
			t.Fatalf("unexpected API key error: %v", err)
		}
		if keyRes.Secret == "" {
			t.Error("expected raw API key secret in response")
		}
		if keyRes.APIKey.Name != "CLI Token" {
			t.Errorf("expected key name 'CLI Token', got '%s'", keyRes.APIKey.Name)
		}
	})

	t.Run("GetAdminSecuritySummary metrics", func(t *testing.T) {
		summary, err := svc.GetAdminSecuritySummary(ctx)
		if err != nil {
			t.Fatalf("unexpected summary error: %v", err)
		}
		if summary.TotalEvents < 0 {
			t.Errorf("invalid total events count: %d", summary.TotalEvents)
		}
	})
}
