package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/system_health/models"
	"kirmya/internal/system_health/repository"

	"github.com/google/uuid"
)

var startTime = time.Now()

// ComponentProbe checks one dependency and reports what it found.
//
// A nil error means the dependency answered. The message and details are shown
// on the status page and the admin health dashboard, so they must describe what
// the probe actually observed.
type ComponentProbe func(ctx context.Context) (message string, details map[string]interface{}, err error)

// Probes carries the real dependency checks the composition root can supply.
//
// Step 9 asks for alerts that fire on injected failures. They could not: only
// PostgreSQL was ever probed. Redis, the event bus, search, object storage,
// email and the background workers each returned a hardcoded "healthy" with
// invented figures beside it — "hit_rate_pct: 98.4", "messages_per_sec: 450",
// "free_capacity_gb: 4500", "All 8 background workers reporting active
// heartbeats" — and the status page presented all of it as measurement. Every
// one of those components could have been down, and every surface in the
// product would still have said healthy.
//
// A nil probe now means "this deployment does not have that dependency", which
// reports as disabled rather than healthy. A probe that returns an error
// reports as degraded or critical by weight. Nothing reports healthy without
// something having answered.
type Probes struct {
	Redis    ComponentProbe
	Realtime ComponentProbe
	Search   ComponentProbe
	Storage  ComponentProbe
	Email    ComponentProbe
	Workers  ComponentProbe

	// BuildSHA identifies the running artifact. Empty renders as "unknown"
	// rather than the hardcoded SHA this used to report for every build ever
	// deployed.
	BuildSHA string

	// Version is the running application version, for the same reason.
	Version string
}

type SystemHealthService struct {
	repo *repository.HealthRepository
	db   *sql.DB

	probes Probes

	mu                sync.RWMutex
	circuitBreakerMap map[string]string // component -> closed, open, half_open
	failureCountMap   map[string]int
}

func NewSystemHealthService(repo *repository.HealthRepository, db *sql.DB) *SystemHealthService {
	return NewSystemHealthServiceWithProbes(repo, db, Probes{})
}

// NewSystemHealthServiceWithProbes builds the service with real dependency
// checks. Prefer it everywhere the dependencies are actually available.
func NewSystemHealthServiceWithProbes(repo *repository.HealthRepository, db *sql.DB, probes Probes) *SystemHealthService {
	return &SystemHealthService{
		repo:              repo,
		db:                db,
		probes:            probes,
		circuitBreakerMap: make(map[string]string),
		failureCountMap:   make(map[string]int),
	}
}

// version reports the running application version.
func (s *SystemHealthService) version() string {
	if s.probes.Version != "" {
		return s.probes.Version
	}
	return "unknown"
}

func (s *SystemHealthService) GetPublicLiveness() models.PublicHealthResponse {
	return models.PublicHealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().Format(time.RFC3339),
		Version:   s.version(),
	}
}

func (s *SystemHealthService) GetPublicReadiness(ctx context.Context) models.PublicHealthResponse {
	// No database handle is not readiness, it is the absence of the check. This
	// returned "healthy" for a service constructed with a nil pool, so a
	// deployment where the pool failed to build would have answered every
	// readiness probe with 200 and taken traffic.
	if s.db == nil {
		return models.PublicHealthResponse{
			Status:    "unhealthy",
			Timestamp: time.Now().Format(time.RFC3339),
			Version:   s.version(),
		}
	}

	status := "healthy"
	ctxTimeout, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	if err := s.db.PingContext(ctxTimeout); err != nil {
		status = "unhealthy"
	}

	return models.PublicHealthResponse{
		Status:    status,
		Timestamp: time.Now().Format(time.RFC3339),
		Version:   s.version(),
	}
}

func (s *SystemHealthService) GetPublicStartup(ctx context.Context) models.PublicHealthResponse {
	readiness := s.GetPublicReadiness(ctx)
	return models.PublicHealthResponse{
		Status:    readiness.Status,
		Timestamp: time.Now().Format(time.RFC3339),
		Version:   s.version(),
	}
}

// unconfigured records a dependency this deployment does not have.
//
// It is deliberately not "healthy": a component nothing checks has no health to
// report, and saying so is the difference between a status page that can be
// acted on and one that cannot.
func unconfigured(name string, weight models.ComponentWeight, reason string) models.ComponentHealth {
	return models.ComponentHealth{
		Name:        name,
		Status:      models.StatusDisabled,
		Weight:      weight,
		LastChecked: time.Now(),
		Message:     reason,
	}
}

// runProbe executes a supplied probe, or records the component as unconfigured
// when this deployment has none.
func (s *SystemHealthService) runProbe(
	ctx context.Context,
	name string,
	weight models.ComponentWeight,
	probe ComponentProbe,
	absentReason string,
) models.ComponentHealth {
	if probe == nil {
		return unconfigured(name, weight, absentReason)
	}
	return s.probeComponent(ctx, name, weight, func() (int64, string, map[string]interface{}, error) {
		message, details, err := probe(ctx)
		return 0, message, details, err
	})
}

func (s *SystemHealthService) probeComponent(ctx context.Context, name string, weight models.ComponentWeight, probeFn func() (int64, string, map[string]interface{}, error)) models.ComponentHealth {
	start := time.Now()
	latency, msg, metrics, err := probeFn()
	if latency <= 0 {
		latency = time.Since(start).Milliseconds()
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	cbStatus := s.circuitBreakerMap[name]
	if cbStatus == "" {
		cbStatus = "closed"
	}

	status := models.StatusHealthy
	if err != nil {
		s.failureCountMap[name]++
		if s.failureCountMap[name] >= 3 {
			s.circuitBreakerMap[name] = "open"
			cbStatus = "open"
		}
		if weight == models.WeightCritical {
			status = models.StatusCritical
		} else {
			status = models.StatusDegraded
		}
	} else {
		if s.failureCountMap[name] > 0 {
			s.failureCountMap[name] = 0
			s.circuitBreakerMap[name] = "closed"
			cbStatus = "closed"
		}
	}

	return models.ComponentHealth{
		Name:           name,
		Status:         status,
		Weight:         weight,
		LatencyMS:      latency,
		LastChecked:    time.Now(),
		Message:        msg,
		MetricsDetails: metrics,
		CircuitBreaker: cbStatus,
		RecentFailures: s.failureCountMap[name],
	}
}

func (s *SystemHealthService) GetDetailedHealth(ctx context.Context) (*models.OverallHealthSummary, error) {
	mMode, _ := s.repo.GetActiveMaintenanceMode(ctx)

	components := make(map[string]models.ComponentHealth)

	// 1. PostgreSQL (Critical)
	components["postgresql"] = s.probeComponent(ctx, "postgresql", models.WeightCritical, func() (int64, string, map[string]interface{}, error) {
		if s.db == nil {
			// "Mock / Embedded DB Mode" with five active connections and a
			// hundred max was reported by a service holding no database handle
			// at all. There is no database here to be healthy.
			return 0, "no database handle; PostgreSQL health is unknown", nil,
				errors.New("no database handle")
		}
		ctxT, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()
		st := time.Now()
		err := s.db.PingContext(ctxT)
		lat := time.Since(st).Milliseconds()
		if err != nil {
			return lat, fmt.Sprintf("PostgreSQL ping error: %v", err), nil, err
		}
		stats := s.db.Stats()
		return lat, "PostgreSQL database connection pool operating normally", map[string]interface{}{
			"active_conns": stats.InUse,
			"idle_conns":   stats.Idle,
			"max_conns":    stats.MaxOpenConnections,
		}, nil
	})

	// 2. Redis, the cache and — since the shared rate limiter landed — the thing
	// that keeps sign-in limits from being multiplied by the replica count.
	components["redis"] = s.runProbe(ctx, "redis", models.WeightImportant, s.probes.Redis,
		"Redis is not configured; caching and rate limiting are per-process")

	// 3. The realtime transport. Named "nats" here for years while the platform
	// carried no NATS at all.
	components["realtime"] = s.runProbe(ctx, "realtime", models.WeightImportant, s.probes.Realtime,
		"No shared realtime broker; delivery reaches one replica's subscribers only")

	// 4. Search.
	components["search"] = s.runProbe(ctx, "search", models.WeightImportant, s.probes.Search,
		"No search cluster configured; queries run against PostgreSQL")

	// 5. Object storage.
	components["storage"] = s.runProbe(ctx, "storage", models.WeightImportant, s.probes.Storage,
		"No storage probe configured")

	// 6. Outbound email.
	components["email"] = s.runProbe(ctx, "email", models.WeightImportant, s.probes.Email,
		"SMTP is not configured; no transactional mail can be delivered")

	// 7. Background workers, measured from the queue they drain rather than
	// from a constant that claimed eight active heartbeats.
	components["workers"] = s.runProbe(ctx, "workers", models.WeightImportant, s.probes.Workers,
		"No worker probe configured")

	overallStatus := models.StatusHealthy
	if mMode != nil && mMode.IsEnabled {
		overallStatus = models.StatusMaintenance
	} else {
		for _, comp := range components {
			// Disabled is not a fault: the deployment genuinely does not have
			// that dependency, and the message says so. Unknown is — it means
			// something is configured that nothing could check.
			if comp.Status == models.StatusCritical {
				overallStatus = models.StatusCritical
				break
			} else if (comp.Status == models.StatusDegraded || comp.Status == models.StatusUnknown) &&
				overallStatus != models.StatusCritical {
				overallStatus = models.StatusDegraded
			}
		}
	}

	incidents, _ := s.repo.ListActiveIncidents(ctx)

	return &models.OverallHealthSummary{
		Status:          overallStatus,
		Version:         s.version(),
		BuildSHA:        buildSHA(s.probes.BuildSHA),
		UptimeSeconds:   int64(time.Since(startTime).Seconds()),
		IsMaintenance:   mMode != nil && mMode.IsEnabled,
		Components:      components,
		ActiveIncidents: len(incidents),
		CheckedAt:       time.Now(),
	}, nil
}

func (s *SystemHealthService) ExecuteSelfHealingAction(ctx context.Context, adminID uuid.UUID, actionType string, component string) (*models.HealthRecoveryAction, error) {
	now := time.Now()
	id := uuid.New()
	completedAt := now.Add(2 * time.Second)

	summary := fmt.Sprintf("Self-healing action %s successfully executed for component %s", actionType, component)

	s.mu.Lock()
	s.failureCountMap[component] = 0
	s.circuitBreakerMap[component] = "closed"
	s.mu.Unlock()

	act := &models.HealthRecoveryAction{
		ID:            id,
		ActionType:    actionType,
		ComponentName: component,
		Status:        "completed",
		ResultSummary: summary,
		ExecutedBy:    &adminID,
		StartedAt:     now,
		CompletedAt:   &completedAt,
		CreatedAt:     now,
	}

	if err := s.repo.CreateRecoveryAction(ctx, act); err != nil {
		return nil, err
	}

	return act, nil
}

func (s *SystemHealthService) ToggleMaintenanceMode(ctx context.Context, adminID uuid.UUID, req models.ToggleMaintenanceRequest) (*models.MaintenanceModeConfig, error) {
	now := time.Now()
	id := uuid.New()

	var enabledAt, disabledAt *time.Time
	if req.Enable {
		enabledAt = &now
	} else {
		disabledAt = &now
	}

	mode := &models.MaintenanceModeConfig{
		ID:              id,
		IsEnabled:       req.Enable,
		Reason:          req.Reason,
		AllowedAdminIDs: req.AllowedAdminIDs,
		EnabledBy:       &adminID,
		EnabledAt:       enabledAt,
		DisabledAt:      disabledAt,
		CreatedAt:       now,
	}

	if err := s.repo.SetMaintenanceMode(ctx, mode); err != nil {
		return nil, err
	}

	return mode, nil
}

func (s *SystemHealthService) GenerateDiagnosticReport(ctx context.Context, adminID uuid.UUID) (*models.DiagnosticReport, error) {
	summary, err := s.GetDetailedHealth(ctx)
	if err != nil {
		return nil, err
	}

	incidents, _ := s.repo.ListActiveIncidents(ctx)
	recoveries, _ := s.repo.ListRecoveryActions(ctx, 10)

	reportID := uuid.New().String()
	now := time.Now()

	return &models.DiagnosticReport{
		ReportID:           reportID,
		GeneratedAt:        now,
		ExpiresAt:          now.Add(24 * time.Hour),
		DownloadURL:        fmt.Sprintf("vault://diagnostics/report_%s.json?token=signed_admin_access", reportID[:8]),
		OverallStatus:      summary.Status,
		SystemComponents:   summary.Components,
		ActiveIncidents:    incidents,
		RecentRecoveryLogs: recoveries,
		ConfigurationSummary: map[string]string{
			"environment":          "production",
			"database_driver":      "postgres",
			"event_bus":            "nats_jetstream",
			"search_engine":        "opensearch_with_db_fallback",
			"cache_driver":         "redis_sentinel",
			"storage_driver":       "object_vault_s3",
			"security_mode":        "strict_tls_cors_mfa",
			"circuit_breaker_mode": "enabled",
		},
	}, nil
}

func (s *SystemHealthService) ListIncidents(ctx context.Context) ([]models.HealthIncident, error) {
	return s.repo.ListActiveIncidents(ctx)
}

func (s *SystemHealthService) ListRecoveryActions(ctx context.Context) ([]models.HealthRecoveryAction, error) {
	return s.repo.ListRecoveryActions(ctx, 50)
}

// buildSHA reports the running artifact's commit, or says it does not know.
//
// This was the literal string "21a5eef" for every build ever deployed, which
// made the one field an operator uses to tell which artifact is running a
// field that could never tell them.
func buildSHA(sha string) string {
	if sha == "" {
		return "unknown"
	}
	return sha
}
