package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *AdminHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	admin := api.Group("/admin")
	admin.Use(sharedMiddleware.AuthRequired())
	{
		admin.GET("/dashboard", handler.GetDashboard)

		// User Management
		admin.GET("/users", handler.ListUsers)
		admin.GET("/users/:id", handler.GetUserByID)
		admin.PUT("/users/:id/status", handler.UpdateUserStatus)

		// Company Management
		admin.GET("/companies", handler.ListCompanies)
		admin.GET("/companies/:id", handler.ListCompanies)
		admin.PUT("/companies/:id/status", handler.UpdateCompanyStatus)

		// Recruiter Management
		admin.GET("/recruiters", handler.ListUsers)

		// Job Moderation
		admin.GET("/jobs", handler.ListJobs)
		admin.GET("/jobs/:id", handler.ListJobs)
		admin.POST("/jobs/:id/moderate", handler.ModerateJob)

		// Applications & Communities
		admin.GET("/applications", handler.ListJobs)
		admin.GET("/communities", handler.ListJobs)

		// Reports
		admin.GET("/reports", handler.ListReports)
		admin.GET("/reports/:id", handler.GetReportByID)
		admin.PUT("/reports/:id", handler.ResolveReport)
		admin.POST("/reports/:id/resolve", handler.ResolveReport)

		// Moderation Queue
		admin.GET("/moderation/queue", handler.ListModerationQueue)
		admin.GET("/moderation/:id", handler.ListModerationQueue)

		// Trust & Safety & Verifications
		admin.GET("/trust-safety", handler.GetDashboard)
		admin.GET("/verifications", handler.ListVerifications)
		admin.POST("/verifications/:id/approve", handler.UpdateCompanyStatus)
		admin.POST("/verifications/:id/reject", handler.UpdateCompanyStatus)

		// System Operations & Background Jobs
		admin.GET("/system/jobs", handler.ListBackgroundJobs)
		admin.GET("/system/jobs/:id", handler.GetBackgroundJobByID)
		admin.POST("/system/jobs/:id/retry", handler.RetryBackgroundJob)

		// Operational Incidents
		admin.GET("/incidents", handler.ListIncidents)
		admin.GET("/incidents/:id", handler.GetIncidentByID)
		admin.POST("/incidents", handler.CreateIncident)
		admin.PUT("/incidents/:id", handler.UpdateIncident)

		// Maintenance Mode
		admin.GET("/maintenance", handler.GetMaintenanceMode)
		admin.PUT("/maintenance", handler.UpdateMaintenanceMode)

		// Roles & Permissions & Impersonation
		admin.GET("/roles", handler.ListRoles)
		admin.POST("/roles/assign", handler.AssignUserRole)
		admin.POST("/users/:id/role", handler.AssignUserRole)
		admin.POST("/users/:id/impersonate", handler.CreateImpersonationSession)
		admin.POST("/impersonation/:id/revoke", handler.RevokeImpersonationSession)

		// System Settings & Feature Flags & Announcements
		admin.GET("/settings", handler.GetSystemSettings)
		admin.GET("/feature-flags", handler.ListFeatureFlags)
		admin.POST("/feature-flags", handler.CreateFeatureFlag)
		admin.PUT("/feature-flags/:id", handler.UpdateFeatureFlag)
		admin.POST("/announcements", handler.CreateAnnouncement)

		// Analytics, Observability & Logs
		admin.GET("/analytics", handler.GetDashboard)
		admin.GET("/audit-logs", handler.ListAuditLogs)
		admin.GET("/security-events", handler.ListSecurityEvents)
		admin.GET("/system/health", handler.GetSystemHealth)

		admin.GET("/observability", handler.GetObservabilitySummary)
		admin.GET("/observability/health", handler.GetObservabilityHealth)
		admin.GET("/observability/metrics", handler.GetObservabilityMetrics)
		admin.GET("/observability/errors", handler.GetObservabilityErrors)
		admin.GET("/observability/incidents", handler.GetObservabilityIncidents)
		admin.GET("/observability/dependencies", handler.GetObservabilityHealth)
	}
}
