package http

import (
	"kirmya/internal/admin/models"
	"kirmya/internal/common/swagger"
)

// swaggerGetDashboard documents GET /api/v1/admin/dashboard.
//
// @Summary      Get Admin Dashboard Stats
// @Description  Returns aggregated high-level administrative platform stats and system health summary.
// @Tags         Admin
// @Produce      json
// @Success      200  {object}  models.AdminDashboardStats
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/dashboard [get]
func swaggerGetDashboard() {}

// swaggerListUsers documents GET /api/v1/admin/users.
//
// @Summary      List Platform Users
// @Description  Returns paginated and filtered user accounts for administration.
// @Tags         Admin
// @Produce      json
// @Param        search  query  string  false  "Search term (name or email)"
// @Param        status  query  string  false  "Filter by account status (Active, Suspended, Restricted)"
// @Param        limit   query  int     false  "Limit"
// @Param        offset  query  int     false  "Offset"
// @Success      200  {array}   map[string]interface{}
// @Security     BearerAuth
// @Router       /api/v1/admin/users [get]
func swaggerListUsers() {}

// swaggerGetUserByID documents GET /api/v1/admin/users/{id}.
//
// @Summary      Get User Details
// @Description  Retrieves comprehensive user account details for admin view.
// @Tags         Admin
// @Produce      json
// @Param        id   path   string  true  "User UUID"
// @Success      200  {object}  map[string]interface{}
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/users/{id} [get]
func swaggerGetUserByID() {}

// swaggerUpdateUserStatus documents PUT /api/v1/admin/users/{id}/status.
//
// @Summary      Update User Status
// @Description  Modifies account status (e.g. Active, Suspended, Restricted) with audit reason logging.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string                        true  "User UUID"
// @Param        payload  body  models.UpdateUserStatusPayload true  "Status payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/users/{id}/status [put]
func swaggerUpdateUserStatus() {}

// swaggerListBackgroundJobs documents GET /api/v1/admin/system/jobs.
//
// @Summary      List Background Jobs
// @Description  Queries asynchronous worker system background tasks and queues.
// @Tags         Admin Ops
// @Produce      json
// @Param        status  query  string  false  "Job status filter (Running, Queued, Failed, Completed)"
// @Param        queue   query  string  false  "Queue name filter"
// @Success      200  {array}   models.BackgroundJobItem
// @Security     BearerAuth
// @Router       /api/v1/admin/system/jobs [get]
func swaggerListBackgroundJobs() {}

// swaggerGetBackgroundJobByID documents GET /api/v1/admin/system/jobs/{id}.
//
// @Summary      Get Background Job Details
// @Description  Retrieves detailed worker task metrics and execution logs.
// @Tags         Admin Ops
// @Produce      json
// @Param        id   path   string  true  "Job UUID"
// @Success      200  {object}  models.BackgroundJobItem
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/system/jobs/{id} [get]
func swaggerGetBackgroundJobByID() {}

// swaggerRetryBackgroundJob documents POST /api/v1/admin/system/jobs/{id}/retry.
//
// @Summary      Retry Background Job
// @Description  Idempotently dispatches a failed background worker job for retry execution.
// @Tags         Admin Ops
// @Produce      json
// @Param        id   path   string  true  "Job UUID"
// @Success      200  {object}  models.BackgroundJobItem
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/system/jobs/{id}/retry [post]
func swaggerRetryBackgroundJob() {}

// swaggerListIncidents documents GET /api/v1/admin/incidents.
//
// @Summary      List Platform Incidents
// @Description  Lists system operational incidents.
// @Tags         Admin Ops
// @Produce      json
// @Param        status    query  string  false  "Incident status (Open, Investigating, Mitigated, Resolved)"
// @Param        severity  query  string  false  "Severity (Critical, Major, Minor, Low)"
// @Success      200  {array}   models.IncidentItem
// @Security     BearerAuth
// @Router       /api/v1/admin/incidents [get]
func swaggerListIncidents() {}

// swaggerCreateIncident documents POST /api/v1/admin/incidents.
//
// @Summary      Create Incident
// @Description  Logs a new platform operational incident.
// @Tags         Admin Ops
// @Accept       json
// @Produce      json
// @Param        payload  body  models.CreateIncidentPayload  true  "Incident details"
// @Success      201  {object}  models.IncidentItem
// @Security     BearerAuth
// @Router       /api/v1/admin/incidents [post]
func swaggerCreateIncident() {}

// swaggerUpdateIncident documents PUT /api/v1/admin/incidents/{id}.
//
// @Summary      Update Incident
// @Description  Updates platform incident status and resolution notes.
// @Tags         Admin Ops
// @Accept       json
// @Produce      json
// @Param        id       path  string                        true  "Incident UUID"
// @Param        payload  body  models.UpdateIncidentPayload  true  "Update payload"
// @Success      200  {object}  models.IncidentItem
// @Security     BearerAuth
// @Router       /api/v1/admin/incidents/{id} [put]
func swaggerUpdateIncident() {}

// swaggerGetMaintenanceMode documents GET /api/v1/admin/maintenance.
//
// @Summary      Get Maintenance Mode State
// @Description  Returns current platform-wide maintenance mode configuration.
// @Tags         Admin Ops
// @Produce      json
// @Success      200  {object}  models.MaintenanceModeConfig
// @Security     BearerAuth
// @Router       /api/v1/admin/maintenance [get]
func swaggerGetMaintenanceMode() {}

// swaggerUpdateMaintenanceMode documents PUT /api/v1/admin/maintenance.
//
// @Summary      Update Maintenance Mode
// @Description  Toggles platform-wide maintenance mode with scheduled maintenance window.
// @Tags         Admin Ops
// @Accept       json
// @Produce      json
// @Param        payload  body  models.UpdateMaintenanceModePayload  true  "Maintenance settings"
// @Success      200  {object}  models.MaintenanceModeConfig
// @Security     BearerAuth
// @Router       /api/v1/admin/maintenance [put]
func swaggerUpdateMaintenanceMode() {}

// swaggerListRoles documents GET /api/v1/admin/roles.
//
// @Summary      List Admin Roles
// @Description  Lists all available platform administrative roles and granular capability scopes.
// @Tags         Admin RBAC
// @Produce      json
// @Success      200  {array}   models.AdminRole
// @Security     BearerAuth
// @Router       /api/v1/admin/roles [get]
func swaggerListRoles() {}

// swaggerAssignUserRole documents POST /api/v1/admin/roles/assign.
//
// @Summary      Assign Role to User
// @Description  Grants an administrative role to a target user with audit reason requirement.
// @Tags         Admin RBAC
// @Accept       json
// @Produce      json
// @Param        payload  body  models.AssignUserRolePayload  true  "Role assignment"
// @Success      200  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/roles/assign [post]
func swaggerAssignUserRole() {}

// swaggerCreateImpersonationSession documents POST /api/v1/admin/users/{id}/impersonate.
//
// @Summary      Create Support Impersonation Session
// @Description  Generates a 15-minute temporary support impersonation session. Enforces reason compliance and zero secret leakage.
// @Tags         Admin Support
// @Accept       json
// @Produce      json
// @Param        id       path  string                             true  "User UUID to impersonate"
// @Param        payload  body  models.SupportImpersonationRequest  true  "Impersonation request"
// @Success      201  {object}  models.UserImpersonationSession
// @Security     BearerAuth
// @Router       /api/v1/admin/users/{id}/impersonate [post]
func swaggerCreateImpersonationSession() {}

// swaggerRevokeImpersonationSession documents POST /api/v1/admin/impersonation/{id}/revoke.
//
// @Summary      Revoke Support Impersonation Session
// @Description  Immediately revokes and deactivates an active support impersonation token.
// @Tags         Admin Support
// @Produce      json
// @Param        id   path   string  true  "Impersonation Session UUID"
// @Success      200  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/impersonation/{id}/revoke [post]
func swaggerRevokeImpersonationSession() {}

// swaggerListFeatureFlags documents GET /api/v1/admin/feature-flags.
//
// @Summary      List Feature Flags
// @Description  Retrieves environment feature flags and rollout percentages.
// @Tags         Admin Config
// @Produce      json
// @Success      200  {array}   models.FeatureFlag
// @Security     BearerAuth
// @Router       /api/v1/admin/feature-flags [get]
func swaggerListFeatureFlags() {}

// swaggerCreateFeatureFlag documents POST /api/v1/admin/feature-flags.
//
// @Summary      Create Feature Flag
// @Description  Registers a new feature rollout flag.
// @Tags         Admin Config
// @Accept       json
// @Produce      json
// @Param        payload  body  models.CreateFeatureFlagPayload  true  "Feature flag configuration"
// @Success      201  {object}  models.FeatureFlag
// @Security     BearerAuth
// @Router       /api/v1/admin/feature-flags [post]
func swaggerCreateFeatureFlag() {}

// swaggerGetSystemHealth documents GET /api/v1/admin/system/health.
//
// @Summary      Get Aggregate Infrastructure Health
// @Description  Aggregates liveness & latency metrics across API, PostgreSQL, Redis, OpenSearch, NATS, Workers, Storage, and OpenTelemetry.
// @Tags         Admin Ops
// @Produce      json
// @Success      200  {object}  models.SystemHealth
// @Security     BearerAuth
// @Router       /api/v1/admin/system/health [get]
func swaggerGetSystemHealth() {}

// Anchor symbols for compilation check
var (
	_ models.BackgroundJobItem
	_ models.IncidentItem
	_ models.MaintenanceModeConfig
	_ models.UserImpersonationSession
	_ swagger.SuccessResponse
)
