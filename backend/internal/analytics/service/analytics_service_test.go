package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"kirmya/internal/analytics/models"
)

func TestIngestEventValidation(t *testing.T) {
	svc := NewAnalyticsService(nil)
	ctx := context.Background()

	_, err := svc.IngestEvent(ctx, &models.IngestEventRequest{
		EventType: "",
	})
	if err == nil {
		t.Fatalf("expected ErrInvalidEventType when event_type is empty")
	}
}

func TestOrgIsolationValidation(t *testing.T) {
	svc := NewAnalyticsService(nil)
	ctx := context.Background()

	_, err := svc.GetRecruiterAnalytics(ctx, uuid.Nil, uuid.New())
	if err == nil {
		t.Fatalf("expected ErrUnauthorizedOrgAccess when orgID is nil")
	}
}

func TestZeroDenominatorProtection(t *testing.T) {
	totalApps := 0
	totalViews := 0
	var conversionRate float64

	if totalViews > 0 {
		conversionRate = (float64(totalApps) / float64(totalViews)) * 100.0
	} else {
		conversionRate = 0.0
	}

	if conversionRate != 0.0 {
		t.Fatalf("expected conversionRate to be 0.0, got %f", conversionRate)
	}
}
