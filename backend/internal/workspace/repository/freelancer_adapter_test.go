package repository

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"kirmya/internal/freelance/domain"
	freelanceRepo "kirmya/internal/freelance/repository"
	freelanceService "kirmya/internal/freelance/service"
)

// The workspace resolver's freelancer question is the capability, not the
// profile row. These pin the mapping from each lifecycle state to the answer
// the resolver receives, because that mapping is the whole of "suspending a
// freelancer removes the Freelancer workspace".
func TestFreelancerAdapterMapsTheLifecycle(t *testing.T) {
	ctx := context.Background()

	newActor := func(t *testing.T) (*FreelancerAdapter, freelanceService.FreelanceService, uuid.UUID) {
		t.Helper()
		svc := freelanceService.NewFreelanceService(freelanceRepo.NewFreelanceRepository(nil))
		return NewFreelancerAdapter(svc), svc, uuid.New()
	}
	draft := domain.SaveProfilePayload{HourlyRate: 90, Tagline: "Backend engineer", Skills: []string{"Go"}}

	t.Run("no profile is not a freelancer", func(t *testing.T) {
		adapter, _, userID := newActor(t)
		holds, err := adapter.HasFreelancerCapability(ctx, userID)
		if err != nil {
			t.Fatalf("capability: %v", err)
		}
		if holds {
			t.Error("an account with no freelancer profile was offered the Freelancer workspace")
		}
	})

	t.Run("pending is not a freelancer", func(t *testing.T) {
		adapter, svc, userID := newActor(t)
		if _, err := svc.SaveProfile(ctx, userID, draft); err != nil {
			t.Fatalf("save draft: %v", err)
		}
		holds, err := adapter.HasFreelancerCapability(ctx, userID)
		if err != nil {
			t.Fatalf("capability: %v", err)
		}
		if holds {
			t.Error("a pending freelancer was offered the Freelancer workspace; " +
				"profile existence is no longer the rule")
		}
	})

	t.Run("active is a freelancer", func(t *testing.T) {
		adapter, svc, userID := newActor(t)
		if _, err := svc.SaveProfile(ctx, userID, draft); err != nil {
			t.Fatalf("save draft: %v", err)
		}
		if _, err := svc.CompleteOnboarding(ctx, userID); err != nil {
			t.Fatalf("complete onboarding: %v", err)
		}
		holds, err := adapter.HasFreelancerCapability(ctx, userID)
		if err != nil {
			t.Fatalf("capability: %v", err)
		}
		if !holds {
			t.Error("an active freelancer was not offered the Freelancer workspace")
		}
	})

	t.Run("suspended is not a freelancer, and reinstating restores it", func(t *testing.T) {
		adapter, svc, userID := newActor(t)
		adminID := uuid.New()
		if _, err := svc.SaveProfile(ctx, userID, draft); err != nil {
			t.Fatalf("save draft: %v", err)
		}
		if _, err := svc.CompleteOnboarding(ctx, userID); err != nil {
			t.Fatalf("complete onboarding: %v", err)
		}

		if err := svc.SuspendCapability(ctx, adminID, userID, "CI"); err != nil {
			t.Fatalf("suspend: %v", err)
		}
		holds, err := adapter.HasFreelancerCapability(ctx, userID)
		if err != nil {
			t.Fatalf("capability: %v", err)
		}
		if holds {
			t.Fatal("a suspended freelancer kept the Freelancer workspace")
		}

		if err := svc.ReinstateCapability(ctx, adminID, userID, "CI"); err != nil {
			t.Fatalf("reinstate: %v", err)
		}
		holds, err = adapter.HasFreelancerCapability(ctx, userID)
		if err != nil {
			t.Fatalf("capability: %v", err)
		}
		if !holds {
			t.Error("reinstating did not restore the Freelancer workspace")
		}
	})
}
