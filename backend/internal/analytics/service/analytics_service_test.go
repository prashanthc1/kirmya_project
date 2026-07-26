package service

import (
	"context"
	"testing"

	"kirmya/internal/analytics/domain"
	"kirmya/internal/analytics/repository"

	"github.com/google/uuid"
)

func TestAdminAnalytics(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	tenantID := uuid.New()

	res, err := svc.GetAdminAnalytics(context.Background(), tenantID)
	if err != nil {
		t.Fatalf("Expected no error fetching admin analytics, got %v", err)
	}

	if res.TotalUsers != 12450 {
		t.Errorf("Expected TotalUsers 12450, got %d", res.TotalUsers)
	}

	if len(res.SkillDemandHeatmap) == 0 {
		t.Errorf("Expected non-empty skill demand heatmap")
	}
}

func TestRecruiterAnalytics(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	tenantID := uuid.New()

	res, err := svc.GetRecruiterAnalytics(context.Background(), tenantID)
	if err != nil {
		t.Fatalf("Expected no error fetching recruiter analytics, got %v", err)
	}

	if res.TotalCandidatesScreened != 480 {
		t.Errorf("Expected TotalCandidatesScreened 480, got %d", res.TotalCandidatesScreened)
	}

	if len(res.CandidateFunnel) == 0 {
		t.Errorf("Expected candidate funnel stages")
	}
}

func TestUserAnalyticsAndTrackEvent(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	tenantID := uuid.New()
	userID := uuid.New()

	err := svc.TrackEvent(context.Background(), tenantID, userID, domain.TrackEventPayload{
		EventName: domain.EventProfileView,
		EntityID:  "candidate-profile-1",
	})
	if err != nil {
		t.Fatalf("Expected no error tracking event, got %v", err)
	}

	res, err := svc.GetUserAnalytics(context.Background(), tenantID, userID)
	if err != nil {
		t.Fatalf("Expected no error fetching user analytics, got %v", err)
	}

	if res.ProfileViewsCount < 1 {
		t.Errorf("Expected profile views count > 0")
	}
}
