package service

import (
	"context"
	"errors"
	"testing"

	"kirmya/internal/system_health/models"
	"kirmya/internal/system_health/repository"
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
