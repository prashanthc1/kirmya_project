package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/system_health/models"
)

// swaggerAdminHealthSummary documents GET /api/v1/admin/system/health
//
// @Summary      Get infrastructure health summary (Admin)
// @Description  Returns real-time status of PostgreSQL, Redis, NATS, and CPU/Memory usage
// @Tags         Admin System Health
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  models.OverallHealthSummary
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/system/health [get]
func swaggerAdminHealthSummary() {}

// swaggerAdminHealthSelfHealing documents POST /api/v1/admin/system/health/self-healing
//
// @Summary      Trigger self-healing remediations (Admin)
// @Description  Executes automated connection pool resets, cache flushes, or worker restarts
// @Tags         Admin System Health
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.ExecuteSelfHealingRequest  true  "Target component"
// @Success      200      {object}  models.HealthRecoveryAction
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/system/health/self-healing [post]
func swaggerAdminHealthSelfHealing() {}

// swaggerAdminHealthMaintenance documents POST /api/v1/admin/system/health/maintenance
//
// @Summary      Toggle maintenance mode (Admin)
// @Description  Enables or disables planned maintenance window with public banner
// @Tags         Admin System Health
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.ToggleMaintenanceRequest  true  "Maintenance settings"
// @Success      200      {object}  models.MaintenanceModeConfig
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/system/health/maintenance [post]
func swaggerAdminHealthMaintenance() {}

// swaggerAdminHealthDiagnosticsReport documents POST /api/v1/admin/system/health/diagnostics/report
//
// @Summary      Generate system diagnostic report (Admin)
// @Description  Compiles runtime stack traces, memory allocations, and query latency stats
// @Tags         Admin System Health
// @Security     BearerAuth
// @Produce      json
// @Success      201  {object}  models.DiagnosticReport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/system/health/diagnostics/report [post]
func swaggerAdminHealthDiagnosticsReport() {}

// swaggerAdminHealthIncidents documents GET /api/v1/admin/system/health/incidents
//
// @Summary      List system health incidents (Admin)
// @Description  Returns timeline of past outages, high latency alerts, or degraded states
// @Tags         Admin System Health
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.HealthIncident
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/system/health/incidents [get]
func swaggerAdminHealthIncidents() {}

// swaggerAdminHealthRecoveries documents GET /api/v1/admin/system/health/recoveries
//
// @Summary      List automated recovery actions (Admin)
// @Description  Returns history of automatic worker restarts and fallback invocations
// @Tags         Admin System Health
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.HealthRecoveryAction
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/system/health/recoveries [get]
func swaggerAdminHealthRecoveries() {}

// swaggerPublicStatus documents GET /status
//
// @Summary      Get public system status
// @Description  Returns high-level platform status and operational indicators
// @Tags         System Health
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /status [get]
func swaggerPublicStatus() {}

// swaggerPublicHealthLive documents GET /health/live
//
// @Summary      Liveness probe
// @Description  Kubernetes/container liveness probe returning 200 OK if the process is responsive
// @Tags         System Health
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /health/live [get]
func swaggerPublicHealthLive() {}

// swaggerPublicHealthReady documents GET /health/ready
//
// @Summary      Readiness probe
// @Description  Kubernetes/container readiness probe checking database and cache connectivity
// @Tags         System Health
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      503  {object}  swagger.ErrorResponse
// @Router       /health/ready [get]
func swaggerPublicHealthReady() {}

// swaggerPublicHealthStartup documents GET /health/startup
//
// @Summary      Startup probe
// @Description  Kubernetes/container startup probe confirming initial configuration loading
// @Tags         System Health
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      503  {object}  swagger.ErrorResponse
// @Router       /health/startup [get]
func swaggerPublicHealthStartup() {}

var (
	_ models.OverallHealthSummary
	_ swagger.ErrorResponse
)


