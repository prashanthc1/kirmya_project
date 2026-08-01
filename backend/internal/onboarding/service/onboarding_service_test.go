package service_test

import (
	"context"
	"testing"

	"kirmya/internal/onboarding/domain"
	"kirmya/internal/onboarding/repository"
	"kirmya/internal/onboarding/service"

	"github.com/google/uuid"
)

func TestOnboardingService_Progress(t *testing.T) {
	repo := repository.NewOnboardingRepository(nil)
	svc := service.NewOnboardingService(repo)
	ctx := context.Background()
	userID := uuid.New()

	// Initial progress
	p, err := svc.GetProgress(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error getting initial progress: %v", err)
	}
	if p.CurrentStep != 1 {
		t.Errorf("expected initial step 1, got %d", p.CurrentStep)
	}

	// Save Step 5
	err = svc.SaveStep(ctx, userID, 5)
	if err != nil {
		t.Fatalf("unexpected error saving step 5: %v", err)
	}

	p2, _ := svc.GetProgress(ctx, userID)
	if p2.CurrentStep != 5 {
		t.Errorf("expected current step 5, got %d", p2.CurrentStep)
	}

	// Complete Onboarding
	err = svc.CompleteOnboarding(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error completing onboarding: %v", err)
	}

	p3, _ := svc.GetProgress(ctx, userID)
	if !p3.IsCompleted {
		t.Errorf("expected is_completed = true")
	}
}

func TestOnboardingService_ProfileCompletion(t *testing.T) {
	repo := repository.NewOnboardingRepository(nil)
	svc := service.NewOnboardingService(repo)
	ctx := context.Background()
	userID := uuid.New()

	comp, err := svc.GetProfileCompletion(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error getting profile completion: %v", err)
	}
	if comp.CompletionScore <= 0 {
		t.Errorf("expected positive completion score, got %d", comp.CompletionScore)
	}
}

func TestOnboardingService_CareerPreferences(t *testing.T) {
	repo := repository.NewOnboardingRepository(nil)
	svc := service.NewOnboardingService(repo)
	ctx := context.Background()
	userID := uuid.New()

	pref := &domain.CareerPreferences{
		DesiredJobTitles:    []string{"Senior Software Engineer", "Tech Lead"},
		PreferredIndustries: []string{"Technology", "Finance"},
		RemotePreference:    "Hybrid",
	}

	err := svc.SaveCareerPreferences(ctx, userID, pref)
	if err != nil {
		t.Fatalf("unexpected error saving career preferences: %v", err)
	}
}
