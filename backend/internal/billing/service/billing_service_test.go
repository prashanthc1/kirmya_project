package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"kirmya/internal/billing/repository"
)

func TestBillingService_DisabledMode(t *testing.T) {
	repo := repository.NewBillingRepository(nil)
	svc := NewBillingService(repo)
	ctx := context.Background()

	t.Run("GetBillingStatus returns billing disabled", func(t *testing.T) {
		status := svc.GetBillingStatus(ctx)
		if status.BillingEnabled {
			t.Errorf("expected BillingEnabled to be false, got true")
		}
	})

	t.Run("HasEntitlement allows access in free mode", func(t *testing.T) {
		allowed, err := svc.HasEntitlement(ctx, uuid.New(), "recruiter.advanced_search")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !allowed {
			t.Errorf("expected feature access to be granted under free mode")
		}
	})

	t.Run("CheckLimit returns unlimited access in free mode", func(t *testing.T) {
		allowed, remaining, err := svc.CheckLimit(ctx, "user", uuid.New(), "jobs.create")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !allowed || remaining != -1 {
			t.Errorf("expected allowed=true and remaining=-1 under free mode, got %v, %d", allowed, remaining)
		}
	})
}
