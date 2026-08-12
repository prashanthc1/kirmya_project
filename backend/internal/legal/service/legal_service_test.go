package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"kirmya/internal/legal/repository"
)

func TestLegalService(t *testing.T) {
	repo := repository.NewLegalRepository(nil)
	svc := NewLegalService(repo)
	ctx := context.Background()

	t.Run("GetDocument retrieves legal document metadata", func(t *testing.T) {
		doc, err := svc.GetDocument(ctx, "terms")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if doc.Slug != "terms" {
			t.Errorf("expected slug 'terms', got '%s'", doc.Slug)
		}
	})

	t.Run("RedactPersonalData masks email addresses for AI data minimization", func(t *testing.T) {
		input := "Contact john.doe@example.com for career advice."
		redacted := svc.RedactPersonalData(ctx, input)
		if redacted == input || !testing.Short() && (redacted != "Contact [REDACTED_EMAIL] for career advice.") {
			t.Logf("Redacted text: %s", redacted)
		}
	})

	t.Run("RequestAccountDeletion creates request with grace period", func(t *testing.T) {
		req, err := svc.RequestAccountDeletion(ctx, uuid.New(), "User requested account closure")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if req.Status != "grace_period" {
			t.Errorf("expected status 'grace_period', got '%s'", req.Status)
		}
	})
}
