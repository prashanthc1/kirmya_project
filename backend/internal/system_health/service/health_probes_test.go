package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"kirmya/internal/system_health/models"
	"kirmya/internal/system_health/repository"

	"github.com/google/uuid"
)

// Step 9 asks for alerts that fire on injected failures. They could not fire,
// because six of the seven components in the health report were constants:
// Redis, the event bus, search, object storage, email and the background
// workers each returned "healthy" with an invented figure beside it. Every one
// of them could have been down while every surface in the product reported the
// platform healthy.
//
// These tests inject the failure the report is supposed to notice.

func newTestService(probes Probes) *SystemHealthService {
	return NewSystemHealthServiceWithProbes(repository.NewHealthRepository(nil), nil, probes)
}

// A dependency nothing checks must not be reported healthy.
func TestUnprobedComponentsAreNotReportedHealthy(t *testing.T) {
	summary, err := newTestService(Probes{}).GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}

	for _, name := range []string{"redis", "realtime", "search", "storage", "email", "workers"} {
		component, ok := summary.Components[name]
		if !ok {
			t.Fatalf("%s is absent from the health report", name)
		}
		if component.Status == models.StatusHealthy {
			t.Errorf("%s reports healthy with no probe configured: %q", name, component.Message)
		}
		if component.Message == "" {
			t.Errorf("%s is not healthy but says nothing about why", name)
		}
	}
}

// A configured dependency that fails must degrade the report, not sit beside a
// healthy one as a detail.
func TestAFailingDependencyDegradesTheReport(t *testing.T) {
	failing := func(context.Context) (string, map[string]interface{}, error) {
		return "Redis did not answer PING", nil, errors.New("dial tcp 127.0.0.1:6379: connect: connection refused")
	}
	// A working database, so the only fault in the report is the injected one.
	svc := newTestService(Probes{Redis: failing})

	summary, err := svc.GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}

	redis := summary.Components["redis"]
	if redis.Status == models.StatusHealthy {
		t.Fatalf("an unreachable Redis reported healthy")
	}
	if redis.Message == "" {
		t.Errorf("the failure is not described, so an operator cannot act on it")
	}
}

// A dependency that answers reports healthy, and reports what it observed.
func TestAnAnsweringDependencyReportsWhatItObserved(t *testing.T) {
	svc := newTestService(Probes{
		Redis: func(context.Context) (string, map[string]interface{}, error) {
			return "Redis answered PING", map[string]interface{}{"rate_limits_shared_across_replicas": true}, nil
		},
	})

	summary, err := svc.GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}

	redis := summary.Components["redis"]
	if redis.Status != models.StatusHealthy {
		t.Fatalf("a reachable Redis reported %s: %s", redis.Status, redis.Message)
	}
	if redis.MetricsDetails["rate_limits_shared_across_replicas"] != true {
		t.Errorf("the probe's observation did not reach the report: %v", redis.MetricsDetails)
	}
}

// The build identifier must identify the build.
func TestBuildIdentityIsNotAConstant(t *testing.T) {
	unknown, err := newTestService(Probes{}).GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}
	// It reported "21a5eef" and "v1.0.0" for every artifact ever deployed,
	// which made the one field an operator uses to tell which build is running
	// a field that could never tell them. Unset, it now says so.
	if unknown.BuildSHA != "unknown" || unknown.Version != "unknown" {
		t.Errorf("unset build identity reported as %s/%s, want unknown/unknown",
			unknown.Version, unknown.BuildSHA)
	}

	known, err := newTestService(Probes{BuildSHA: "deadbee", Version: "2026.09.08"}).
		GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}
	if known.BuildSHA != "deadbee" || known.Version != "2026.09.08" {
		t.Errorf("supplied build identity reported as %s/%s", known.Version, known.BuildSHA)
	}
}

func TestMailerHealthReportsDisabledVsHealthyVsCritical(t *testing.T) {
	ctx := context.Background()

	// 1. In development, unconfigured mailer reports disabled (not critical, not healthy)
	t.Run("development unconfigured reports disabled", func(t *testing.T) {
		t.Setenv("APP_ENV", "development")
		t.Setenv("SMTP_HOST", "")
		t.Setenv("RESEND_API_KEY", "")

		svc := newTestService(Probes{AppEnv: "development"})
		summary, err := svc.GetDetailedHealth(ctx)
		if err != nil {
			t.Fatalf("detailed health: %v", err)
		}
		email := summary.Components["email"]
		if email.Status != models.StatusDisabled {
			t.Errorf("expected email status disabled in dev, got %s", email.Status)
		}
		mailerComp := summary.Components["mailer"]
		if mailerComp.Status != models.StatusDisabled {
			t.Errorf("expected mailer status disabled in dev, got %s", mailerComp.Status)
		}
	})

	// 2. In production, unconfigured mailer reports critical, not a silent skip
	t.Run("production unconfigured reports critical", func(t *testing.T) {
		t.Setenv("APP_ENV", "production")
		t.Setenv("SMTP_HOST", "")
		t.Setenv("RESEND_API_KEY", "")

		svc := newTestService(Probes{AppEnv: "production"})
		summary, err := svc.GetDetailedHealth(ctx)
		if err != nil {
			t.Fatalf("detailed health: %v", err)
		}
		email := summary.Components["email"]
		if email.Status != models.StatusCritical {
			t.Errorf("expected email status critical in production without mailer, got %s", email.Status)
		}
		mailerComp := summary.Components["mailer"]
		if mailerComp.Status != models.StatusCritical {
			t.Errorf("expected mailer status critical in production without mailer, got %s", mailerComp.Status)
		}
		if summary.Status != models.StatusCritical {
			t.Errorf("expected overall status critical in production without mailer, got %s", summary.Status)
		}
	})

	// 3. Configured with SMTP -> healthy
	t.Run("configured SMTP reports healthy", func(t *testing.T) {
		t.Setenv("APP_ENV", "production")
		t.Setenv("SMTP_HOST", "smtp.example.com")
		t.Setenv("SMTP_FROM_EMAIL", "noreply@example.com")
		t.Setenv("RESEND_API_KEY", "")

		svc := newTestService(Probes{AppEnv: "production"})
		summary, err := svc.GetDetailedHealth(ctx)
		if err != nil {
			t.Fatalf("detailed health: %v", err)
		}
		email := summary.Components["email"]
		if email.Status != models.StatusHealthy {
			t.Errorf("expected email status healthy with SMTP, got %s", email.Status)
		}
		if email.MetricsDetails["transport"] != "smtp" {
			t.Errorf("expected transport smtp, got %v", email.MetricsDetails["transport"])
		}
		mailerComp := summary.Components["mailer"]
		if mailerComp.Status != models.StatusHealthy {
			t.Errorf("expected mailer status healthy with SMTP, got %s", mailerComp.Status)
		}
	})

	// 4. Configured with Resend -> healthy
	t.Run("configured Resend reports healthy", func(t *testing.T) {
		t.Setenv("APP_ENV", "production")
		t.Setenv("RESEND_API_KEY", "re_test_key")
		t.Setenv("RESEND_FROM_EMAIL", "noreply@kirmya.com")
		t.Setenv("SMTP_HOST", "")

		svc := newTestService(Probes{AppEnv: "production"})
		summary, err := svc.GetDetailedHealth(ctx)
		if err != nil {
			t.Fatalf("detailed health: %v", err)
		}
		email := summary.Components["email"]
		if email.Status != models.StatusHealthy {
			t.Errorf("expected email status healthy with Resend, got %s", email.Status)
		}
		if email.MetricsDetails["transport"] != "resend" {
			t.Errorf("expected transport resend, got %v", email.MetricsDetails["transport"])
		}
		mailerComp := summary.Components["mailer"]
		if mailerComp.Status != models.StatusHealthy {
			t.Errorf("expected mailer status healthy with Resend, got %s", mailerComp.Status)
		}
	})
}

type mockStorageChecker struct {
	driver       string
	existsCalled bool
	existsErr    error
	existsResult bool
}

func (m *mockStorageChecker) DriverName() string {
	return m.driver
}

func (m *mockStorageChecker) Exists(ctx context.Context, key string) (bool, error) {
	m.existsCalled = true
	return m.existsResult, m.existsErr
}

func TestStorageProbeLocalDiskSaysProviderLocal(t *testing.T) {
	t.Setenv("STORAGE_ENDPOINT", "")
	mock := &mockStorageChecker{driver: "local"}
	probe := NewStorageProbe(mock)

	svc := newTestService(Probes{Storage: probe})
	summary, err := svc.GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}

	storage := summary.Components["storage"]
	if storage.Status != models.StatusHealthy {
		t.Fatalf("expected healthy storage on local disk, got %s: %s", storage.Status, storage.Message)
	}
	if !mock.existsCalled {
		t.Fatalf("expected real Exists call on storage")
	}
	if storage.Provider != "local" {
		t.Errorf("expected Provider=local, got %q", storage.Provider)
	}
	if !strings.Contains(storage.Message, "provider=local") {
		t.Errorf("expected message to say provider=local, got %q", storage.Message)
	}
	if storage.MetricsDetails["provider"] != "local" {
		t.Errorf("expected MetricsDetails[provider]=local, got %v", storage.MetricsDetails["provider"])
	}

	// Verify JSON output
	jsonBytes, err := json.Marshal(summary)
	if err != nil {
		t.Fatalf("json marshal: %v", err)
	}
	jsonStr := string(jsonBytes)
	if strings.Contains(strings.ToLower(jsonStr), "object_vault_s3") {
		t.Errorf("JSON claimed object_vault_s3 when STORAGE_ENDPOINT is unset: %s", jsonStr)
	}
	if !strings.Contains(jsonStr, `"provider":"local"`) {
		t.Errorf("JSON missing \"provider\":\"local\": %s", jsonStr)
	}
}

func TestStorageProbeCannotClaimS3WhenStorageEndpointUnset(t *testing.T) {
	t.Setenv("STORAGE_ENDPOINT", "")
	// Even if a probe or checker claims driver "s3", unset STORAGE_ENDPOINT must fail closed to local
	mock := &mockStorageChecker{driver: "s3"}
	probe := NewStorageProbe(mock)

	svc := newTestService(Probes{Storage: probe})
	summary, err := svc.GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}

	storage := summary.Components["storage"]
	if storage.Provider == "s3" {
		t.Errorf("storage claimed S3 when STORAGE_ENDPOINT is unset")
	}
	if storage.Provider != "local" {
		t.Errorf("expected provider=local when STORAGE_ENDPOINT is unset, got %q", storage.Provider)
	}
	if !strings.Contains(storage.Message, "provider=local") {
		t.Errorf("expected message to contain provider=local, got %q", storage.Message)
	}

	jsonBytes, _ := json.Marshal(summary)
	if strings.Contains(string(jsonBytes), `"provider":"s3"`) {
		t.Errorf("JSON claimed S3 provider when STORAGE_ENDPOINT is unset: %s", string(jsonBytes))
	}

	// Also check diagnostic report
	report, err := svc.GenerateDiagnosticReport(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("diagnostic report: %v", err)
	}
	if report.ConfigurationSummary["storage_driver"] != "local" {
		t.Errorf("configurationSummary claimed %s for storage_driver, want local", report.ConfigurationSummary["storage_driver"])
	}

	reportBytes, _ := json.Marshal(report)
	if strings.Contains(strings.ToLower(string(reportBytes)), "object_vault_s3") {
		t.Errorf("DiagnosticReport JSON claimed object_vault_s3 when STORAGE_ENDPOINT unset: %s", string(reportBytes))
	}
}

func TestStorageProbeS3RequiresRealExistsCall(t *testing.T) {
	t.Setenv("STORAGE_ENDPOINT", "https://s3.us-east-1.amazonaws.com")

	// 1. When Exists fails, probe must fail
	t.Run("failing Exists call degrades or fails probe", func(t *testing.T) {
		mock := &mockStorageChecker{
			driver:    "s3",
			existsErr: errors.New("connection timed out"),
		}
		probe := NewStorageProbe(mock)
		svc := newTestService(Probes{Storage: probe})
		summary, err := svc.GetDetailedHealth(context.Background())
		if err != nil {
			t.Fatalf("detailed health: %v", err)
		}
		storage := summary.Components["storage"]
		if storage.Status == models.StatusHealthy {
			t.Errorf("expected non-healthy storage when Exists fails, got %s", storage.Status)
		}
		if !mock.existsCalled {
			t.Errorf("expected real Exists call to have occurred")
		}
	})

	// 2. When Exists succeeds, probe reports healthy with S3
	t.Run("successful Exists call reports healthy S3", func(t *testing.T) {
		mock := &mockStorageChecker{
			driver:       "s3",
			existsResult: false, // 404/not found is normal for absent probe key, err is nil
			existsErr:    nil,
		}
		probe := NewStorageProbe(mock)
		svc := newTestService(Probes{Storage: probe})
		summary, err := svc.GetDetailedHealth(context.Background())
		if err != nil {
			t.Fatalf("detailed health: %v", err)
		}
		storage := summary.Components["storage"]
		if storage.Status != models.StatusHealthy {
			t.Fatalf("expected healthy S3 storage, got %s: %s", storage.Status, storage.Message)
		}
		if !mock.existsCalled {
			t.Errorf("expected real Exists call to have occurred")
		}
		if storage.Provider != "s3" {
			t.Errorf("expected provider=s3, got %q", storage.Provider)
		}
		if storage.MetricsDetails["exists_call"] != "verified" {
			t.Errorf("expected exists_call=verified, got %v", storage.MetricsDetails["exists_call"])
		}
	})
}

func TestRedisMissingReportsDegradedSingleReplicaNotHealthyWithPubsub(t *testing.T) {
	// Nil Redis probe (Redis missing)
	svc := newTestService(Probes{Redis: nil, Realtime: nil})
	summary, err := svc.GetDetailedHealth(context.Background())
	if err != nil {
		t.Fatalf("detailed health: %v", err)
	}

	redis := summary.Components["redis"]
	if redis.Status != models.StatusDegraded {
		t.Errorf("expected redis status degraded when missing, got %s", redis.Status)
	}
	if !strings.Contains(redis.Message, "degraded (single replica)") {
		t.Errorf("expected redis message to say degraded (single replica), got %q", redis.Message)
	}
	if strings.Contains(redis.Message, "healthy-with-pubsub") {
		t.Errorf("redis message cannot claim healthy-with-pubsub when missing")
	}

	realtime := summary.Components["realtime"]
	if realtime.Status != models.StatusDegraded {
		t.Errorf("expected realtime status degraded when Redis missing, got %s", realtime.Status)
	}
	if !strings.Contains(realtime.Message, "degraded (single replica)") {
		t.Errorf("expected realtime message to say degraded (single replica), got %q", realtime.Message)
	}
	if strings.Contains(realtime.Message, "healthy-with-pubsub") {
		t.Errorf("realtime message cannot claim healthy-with-pubsub when Redis missing")
	}

	report, err := svc.GenerateDiagnosticReport(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("diagnostic report: %v", err)
	}
	if report.ConfigurationSummary["cache_driver"] == "redis_sentinel" {
		t.Errorf("cache_driver cannot claim redis_sentinel when Redis is missing")
	}
	if report.ConfigurationSummary["event_bus"] == "nats_jetstream" {
		t.Errorf("event_bus cannot claim nats_jetstream when Redis/realtime is missing")
	}
}
