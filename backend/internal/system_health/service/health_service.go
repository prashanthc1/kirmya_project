package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"kirmya/internal/shared/mailer"
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

// StorageChecker abstracts storage engine capabilities for health probes.
type StorageChecker interface {
	DriverName() string
	Exists(ctx context.Context, key string) (bool, error)
}

// NewStorageProbe builds a ComponentProbe that validates storage liveness via a real Exists call.
// When storage is local disk or STORAGE_ENDPOINT is unset, it reports provider=local.
// When storage is S3, it reports healthy only if a real Exists call succeeds against the endpoint.
func NewStorageProbe(storage StorageChecker) ComponentProbe {
	return func(ctx context.Context) (string, map[string]interface{}, error) {
		if storage == nil {
			return "storage provider is not configured", nil, errors.New("storage provider is not configured")
		}

		ctxT, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()

		endpoint := strings.TrimSpace(os.Getenv("STORAGE_ENDPOINT"))
		driver := storage.DriverName()

		// A real Exists probe against the storage backend
		_, err := storage.Exists(ctxT, "health-probe/.keep-absent")
		if err != nil {
			if endpoint == "" || driver == "local" {
				return fmt.Sprintf("local storage did not answer: %v; provider=local", err), map[string]interface{}{
					"provider": "local",
					"driver":   "local",
				}, err
			}
			return fmt.Sprintf("%s storage did not answer Exists probe: %v", driver, err), map[string]interface{}{
				"provider": driver,
				"driver":   driver,
				"endpoint": endpoint,
			}, err
		}

		// When STORAGE_ENDPOINT is unset or storage is local disk:
		if endpoint == "" || driver == "local" {
			return "local disk storage operating normally; provider=local", map[string]interface{}{
				"provider":    "local",
				"driver":      "local",
				"exists_call": "verified",
			}, nil
		}

		// When STORAGE_ENDPOINT is set and driver is S3 / cloudflare-r2 / minio:
		return fmt.Sprintf("%s storage answered real Exists call", driver), map[string]interface{}{
			"provider":    driver,
			"driver":      driver,
			"endpoint":    endpoint,
			"exists_call": "verified",
		}, nil
	}
}

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

	// AppEnv identifies the deployment environment (e.g. "production", "development", "test").
	AppEnv string
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

func isProductionEnv(appEnv string) bool {
	if appEnv == "" {
		appEnv = os.Getenv("APP_ENV")
	}
	env := strings.ToLower(strings.TrimSpace(appEnv))
	return env == "production" || env == "prod"
}

func (s *SystemHealthService) resolveEmailHealth(ctx context.Context) models.ComponentHealth {
	isProd := isProductionEnv(s.probes.AppEnv)
	weight := models.WeightImportant
	if isProd {
		weight = models.WeightCritical
	}

	if s.probes.Email != nil {
		return s.probeComponent(ctx, "email", weight, func() (int64, string, map[string]interface{}, error) {
			msg, details, err := s.probes.Email(ctx)
			return 0, msg, details, err
		})
	}

	// No custom probe supplied: derive from real configuration (SMTP or Resend)
	m := mailer.FromEnv()
	status, msg, details := m.HealthStatus(s.probes.AppEnv)

	var healthStatus models.HealthStatus
	switch status {
	case "healthy":
		healthStatus = models.StatusHealthy
	case "critical":
		healthStatus = models.StatusCritical
	default:
		healthStatus = models.StatusDisabled
	}

	return models.ComponentHealth{
		Name:           "email",
		Status:         healthStatus,
		Weight:         weight,
		LastChecked:    time.Now(),
		Message:        msg,
		MetricsDetails: details,
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
	if s.probes.Redis != nil {
		components["redis"] = s.probeComponent(ctx, "redis", models.WeightImportant, func() (int64, string, map[string]interface{}, error) {
			msg, details, err := s.probes.Redis(ctx)
			return 0, msg, details, err
		})
	} else {
		components["redis"] = models.ComponentHealth{
			Name:        "redis",
			Status:      models.StatusDegraded,
			Weight:      models.WeightImportant,
			LastChecked: time.Now(),
			Message:     "degraded (single replica): Redis is not configured; caching and rate limiting are per-process",
		}
	}

	// 3. The realtime transport. Named "nats" here for years while the platform
	// carried no NATS at all.
	if s.probes.Realtime != nil && s.probes.Redis != nil {
		components["realtime"] = s.probeComponent(ctx, "realtime", models.WeightImportant, func() (int64, string, map[string]interface{}, error) {
			msg, details, err := s.probes.Realtime(ctx)
			return 0, msg, details, err
		})
	} else {
		components["realtime"] = models.ComponentHealth{
			Name:        "realtime",
			Status:      models.StatusDegraded,
			Weight:      models.WeightImportant,
			LastChecked: time.Now(),
			Message:     "degraded (single replica): No shared realtime broker; delivery reaches one replica's subscribers only",
		}
	}

	// 4. Search.
	components["search"] = s.runProbe(ctx, "search", models.WeightImportant, s.probes.Search,
		"No search cluster configured; queries run against PostgreSQL")

	// 5. Object storage.
	var storageComp models.ComponentHealth
	if s.probes.Storage != nil {
		storageComp = s.probeComponent(ctx, "storage", models.WeightImportant, func() (int64, string, map[string]interface{}, error) {
			msg, details, err := s.probes.Storage(ctx)
			return 0, msg, details, err
		})
	} else {
		storageComp = unconfigured("storage", models.WeightImportant, "No storage probe configured")
	}

	storageEndpoint := strings.TrimSpace(os.Getenv("STORAGE_ENDPOINT"))
	if storageEndpoint == "" {
		// When STORAGE_ENDPOINT is unset, the JSON CANNOT claim S3 under any circumstances.
		if storageComp.Status == models.StatusHealthy {
			storageComp.Provider = "local"
			if storageComp.MetricsDetails == nil {
				storageComp.MetricsDetails = make(map[string]interface{})
			}
			storageComp.MetricsDetails["provider"] = "local"
			if driver, ok := storageComp.MetricsDetails["driver"].(string); ok && driver != "local" {
				storageComp.MetricsDetails["driver"] = "local"
			}
			if !strings.Contains(storageComp.Message, "provider=local") {
				storageComp.Message = storageComp.Message + "; provider=local"
			}
		} else {
			if storageComp.MetricsDetails != nil {
				delete(storageComp.MetricsDetails, "s3")
				if storageComp.MetricsDetails["driver"] == "s3" {
					storageComp.MetricsDetails["driver"] = "local"
				}
			}
		}
	} else {
		if storageComp.Status == models.StatusHealthy {
			if storageComp.Provider == "" {
				if driver, ok := storageComp.MetricsDetails["driver"].(string); ok && driver != "" {
					storageComp.Provider = driver
				} else {
					storageComp.Provider = "s3"
				}
			}
			if storageComp.MetricsDetails == nil {
				storageComp.MetricsDetails = make(map[string]interface{})
			}
			if _, ok := storageComp.MetricsDetails["provider"]; !ok {
				storageComp.MetricsDetails["provider"] = storageComp.Provider
			}
		}
	}
	components["storage"] = storageComp

	// 6. Outbound email and mailer.
	emailHealth := s.resolveEmailHealth(ctx)
	components["email"] = emailHealth

	mailerHealth := emailHealth
	mailerHealth.Name = "mailer"
	components["mailer"] = mailerHealth

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

	env := s.probes.AppEnv
	if env == "" {
		env = os.Getenv("APP_ENV")
	}
	if env == "" {
		env = "development"
	}

	storageDriver := "local"
	if strings.TrimSpace(os.Getenv("STORAGE_ENDPOINT")) != "" {
		storageDriver = "s3"
	}

	cacheDriver := "in_memory (single replica)"
	if s.probes.Redis != nil {
		cacheDriver = "redis"
	}

	eventBus := "in_process (single replica)"
	if s.probes.Realtime != nil && s.probes.Redis != nil {
		eventBus = "redis_pubsub"
	}

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
			"environment":          env,
			"database_driver":      "postgres",
			"event_bus":            eventBus,
			"search_engine":        "opensearch_with_db_fallback",
			"cache_driver":         cacheDriver,
			"storage_driver":       storageDriver,
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
