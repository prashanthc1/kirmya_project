package service

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"
	"kirmya/internal/analytics/models"
	"kirmya/internal/analytics/repository"
)

func TestIngestEventValidation(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()

	// 1. Empty event_type
	_, err := svc.IngestEvent(ctx, &models.IngestEventRequest{
		EventType: "",
	})
	if err != ErrInvalidEventType {
		t.Fatalf("expected ErrInvalidEventType, got %v", err)
	}

	// 2. Unknown event_type
	_, err = svc.IngestEvent(ctx, &models.IngestEventRequest{
		EventType: "unknown_event",
	})
	if err != ErrUnknownEventType {
		t.Fatalf("expected ErrUnknownEventType, got %v", err)
	}

	// 3. Oversized metadata > 64KB
	largeMetadata := map[string]interface{}{
		"data": strings.Repeat("A", 70000),
	}
	_, err = svc.IngestEvent(ctx, &models.IngestEventRequest{
		EventType: "profile.viewed",
		Metadata:  largeMetadata,
	})
	if err != ErrOversizedMetadata {
		t.Fatalf("expected ErrOversizedMetadata, got %v", err)
	}

	// 4. Sensitive key in metadata
	sensitiveMetadata := map[string]interface{}{
		"user_password": "supersecretpassword",
	}
	_, err = svc.IngestEvent(ctx, &models.IngestEventRequest{
		EventType: "profile.viewed",
		Metadata:  sensitiveMetadata,
	})
	if err != ErrSensitiveMetadataKey {
		t.Fatalf("expected ErrSensitiveMetadataKey, got %v", err)
	}
}

func TestIdempotencyDeduplication(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()

	idempotencyKey := "idem_test_key_1001"
	req := &models.IngestEventRequest{
		EventType:      "job.viewed",
		IdempotencyKey: idempotencyKey,
	}

	evt1, err := svc.IngestEvent(ctx, req)
	if err != nil {
		t.Fatalf("unexpected error on first ingest: %v", err)
	}

	evt2, err := svc.IngestEvent(ctx, req)
	if err != nil {
		t.Fatalf("unexpected error on second ingest: %v", err)
	}

	if evt1.ID != evt2.ID {
		t.Fatalf("expected duplicate event ID to match %s, got %s", evt1.ID, evt2.ID)
	}
}

func TestConsentFiltering(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()

	userID := uuid.New()

	// Initial consent: default allowed
	consent, err := svc.GetUserConsent(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error fetching consent: %v", err)
	}
	if !consent.OptionalAnalyticsEnabled {
		t.Fatalf("expected optional analytics enabled by default")
	}

	// Ingest event succeeds when consent enabled
	_, err = svc.IngestEvent(ctx, &models.IngestEventRequest{
		EventType: "job.search",
		UserID:    &userID,
	})
	if err != nil {
		t.Fatalf("unexpected error when consent enabled: %v", err)
	}

	// Disable optional analytics
	consent.OptionalAnalyticsEnabled = false
	_, err = svc.UpdateUserConsent(ctx, userID, consent)
	if err != nil {
		t.Fatalf("unexpected error updating consent: %v", err)
	}

	// Ingest optional event fails with ErrConsentDenied
	_, err = svc.IngestEvent(ctx, &models.IngestEventRequest{
		EventType: "job.search",
		UserID:    &userID,
	})
	if err != ErrConsentDenied {
		t.Fatalf("expected ErrConsentDenied when optional analytics disabled, got %v", err)
	}
}

func TestPrivacyThresholdEnforcement(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()

	grid, err := svc.GetCohortGrid(ctx)
	if err != nil {
		t.Fatalf("unexpected error getting cohort grid: %v", err)
	}

	for _, item := range grid.CohortItems {
		if item.UserCount > 0 && item.UserCount < MinPrivacyThreshold {
			t.Fatalf("cohort user count %d is below MinPrivacyThreshold (%d)", item.UserCount, MinPrivacyThreshold)
		}
	}
}

func TestRetentionCleanup(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()

	config := &models.DataRetentionConfig{
		RetentionDays:       30,
		PurgeRawEvents:      true,
		KeepDailyAggregates: true,
	}

	purged, err := svc.TriggerRetentionCleanup(ctx, config)
	if err != nil {
		t.Fatalf("unexpected error during retention cleanup: %v", err)
	}

	if purged < 0 {
		t.Fatalf("expected non-negative purged count, got %d", purged)
	}
}

func TestCustomAndScheduledReports(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()
	adminID := uuid.New()

	// 1. Custom report
	customReq := &models.CustomReportRequest{
		Title:         "Executive Retain Digest",
		DateRangeDays: 30,
		ReportType:    "custom_funnel",
		Metrics:       []string{"registrations", "conversions"},
		ExportFormat:  "csv",
	}

	job, err := svc.CreateCustomReport(ctx, adminID, customReq)
	if err != nil {
		t.Fatalf("unexpected error creating custom report: %v", err)
	}
	if job.Status != "completed" {
		t.Fatalf("expected status completed, got %s", job.Status)
	}

	// 2. Scheduled report
	schedReq := &models.ScheduledReportConfig{
		Title:          "Weekly Growth Report",
		CronExpression: "0 0 * * 1",
		ReportType:     "growth",
		ExportFormat:   "csv",
		Recipients:     []string{"admin@kirmya.org"},
	}

	createdSched, err := svc.CreateScheduledReport(ctx, adminID, schedReq)
	if err != nil {
		t.Fatalf("unexpected error creating scheduled report: %v", err)
	}
	if createdSched.ID == uuid.Nil {
		t.Fatalf("expected non-nil ID for scheduled report")
	}
}

func TestSystemPerformanceMetrics(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()

	perf, err := svc.GetSystemPerformanceAnalytics(ctx)
	if err != nil {
		t.Fatalf("unexpected error getting system performance: %v", err)
	}
	if perf.P50LatencyMs <= 0 || perf.OpenTelemetryStatus != "active" {
		t.Fatalf("invalid system performance metrics: %+v", perf)
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

func TestDomainAnalyticsMethods(t *testing.T) {
	repo := repository.NewAnalyticsRepository(nil)
	svc := NewAnalyticsService(repo)
	ctx := context.Background()

	ts, err := svc.GetTrustSafetyAnalytics(ctx)
	if err != nil || ts.TotalReports <= 0 {
		t.Fatalf("expected valid trust safety analytics, got %+v, err: %v", ts, err)
	}

	m, err := svc.GetMentorshipAnalytics(ctx, nil)
	if err != nil || m.TotalRequests <= 0 {
		t.Fatalf("expected valid mentorship analytics, got %+v, err: %v", m, err)
	}

	l, err := svc.GetLearningAnalytics(ctx, nil)
	if err != nil || l.ResourcesViewed <= 0 {
		t.Fatalf("expected valid learning analytics, got %+v, err: %v", l, err)
	}

	fa, err := svc.GetFeatureAdoption(ctx)
	if err != nil || len(fa.FeatureUsageMap) == 0 {
		t.Fatalf("expected valid feature adoption metrics, got %+v, err: %v", fa, err)
	}
}
