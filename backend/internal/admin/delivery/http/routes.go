package http

import (
	"github.com/gin-gonic/gin"

	adminDomain "kirmya/internal/admin/domain"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *AdminHandler, authMiddleware ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}
	admin := api.Group("/admin")
	// Unconditional. This guard previously applied only when an AuthMiddleware
	// value was supplied, so constructing the router without one left the whole
	// administrative surface open rather than closed.
	admin.Use(sharedMiddleware.RequireAdmin())

	// Granular permissions, applied inside RequireAdmin() and never instead of
	// it. The outer gate decides who is an administrator, from users.role_id;
	// these decide what a given administrator may do, from admin_user_roles.
	//
	// Adding them changes nothing for anybody today: an account with no
	// assignment holds every permission, and no account has an assignment. They
	// take effect only when somebody is deliberately narrowed, and even then
	// they can only refuse - see admin/domain for why no arrangement of roles
	// grants more than assigning none.
	//
	// The mapping is here, beside the routes, so a route added to this file
	// without a permission is visible as an omission rather than hidden in a
	// table somewhere else.
	perm := func(code string) gin.HandlerFunc {
		return RequirePermission(handler.service, code)
	}
	{
		admin.GET("/dashboard", perm(adminDomain.PermDashboardRead), handler.GetDashboard)

		// User Management
		admin.GET("/users", perm(adminDomain.PermUsersRead), handler.ListUsers)
		admin.GET("/users/:id", perm(adminDomain.PermUsersRead), handler.GetUserByID)
		admin.PUT("/users/:id/status", perm(adminDomain.PermUsersSuspend), handler.UpdateUserStatus)

		// Company Management
		admin.GET("/companies", perm(adminDomain.PermCompaniesRead), handler.ListCompanies)
		admin.GET("/companies/:id", perm(adminDomain.PermCompaniesRead), handler.ListCompanies)
		admin.PUT("/companies/:id/status", perm(adminDomain.PermCompaniesSuspend), handler.UpdateCompanyStatus)

		// Recruiter Management
		admin.GET("/recruiters", perm(adminDomain.PermRecruitersRead), handler.ListUsers)

		// Job Moderation
		admin.GET("/jobs", perm(adminDomain.PermJobsRead), handler.ListJobs)
		admin.GET("/jobs/:id", perm(adminDomain.PermJobsRead), handler.ListJobs)
		admin.POST("/jobs/:id/moderate", perm(adminDomain.PermJobsModerate), handler.ModerateJob)

		// Applications & Communities
		admin.GET("/applications", perm(adminDomain.PermApplicationsRead), handler.ListJobs)
		admin.GET("/communities", perm(adminDomain.PermCommunitiesModerate), handler.ListJobs)

		// Reports
		admin.GET("/reports", perm(adminDomain.PermReportsRead), handler.ListReports)
		admin.GET("/reports/:id", perm(adminDomain.PermReportsRead), handler.GetReportByID)
		admin.PUT("/reports/:id", perm(adminDomain.PermReportsResolve), handler.ResolveReport)
		admin.POST("/reports/:id/resolve", perm(adminDomain.PermReportsResolve), handler.ResolveReport)

		// Moderation Queue
		admin.GET("/moderation/queue", perm(adminDomain.PermModerationReview), handler.ListModerationQueue)
		admin.GET("/moderation/:id", perm(adminDomain.PermModerationReview), handler.ListModerationQueue)

		// Verifications
		admin.GET("/verifications", perm(adminDomain.PermVerificationsReview), handler.ListVerifications)
		admin.POST("/verifications/:id/approve", perm(adminDomain.PermCompaniesVerify), handler.UpdateCompanyStatus)
		admin.POST("/verifications/:id/reject", perm(adminDomain.PermCompaniesVerify), handler.UpdateCompanyStatus)

		// System Operations & Background Jobs
		admin.GET("/system/jobs", perm(adminDomain.PermSystemJobsRead), handler.ListBackgroundJobs)
		admin.GET("/system/jobs/:id", perm(adminDomain.PermSystemJobsRead), handler.GetBackgroundJobByID)
		admin.POST("/system/jobs/:id/retry", perm(adminDomain.PermSystemJobsRetry), handler.RetryBackgroundJob)

		// Operational Incidents
		admin.GET("/incidents", perm(adminDomain.PermIncidentsManage), handler.ListIncidents)
		admin.GET("/incidents/:id", perm(adminDomain.PermIncidentsManage), handler.GetIncidentByID)
		admin.POST("/incidents", perm(adminDomain.PermIncidentsManage), handler.CreateIncident)
		admin.PUT("/incidents/:id", perm(adminDomain.PermIncidentsManage), handler.UpdateIncident)

		// Maintenance Mode
		admin.GET("/maintenance", perm(adminDomain.PermMaintenanceManage), handler.GetMaintenanceMode)
		admin.PUT("/maintenance", perm(adminDomain.PermMaintenanceManage), handler.UpdateMaintenanceMode)

		// Roles & Permissions & Impersonation
		//
		// roles.manage is held by super_admin alone among the seeded roles, so
		// a narrowed administrator cannot widen themselves or anybody else.
		// Listing the roles needs only dashboard.read: seeing what the roles
		// are is not the same as handing one out.
		admin.GET("/roles", perm(adminDomain.PermDashboardRead), handler.ListRoles)
		admin.POST("/roles/assign", perm(adminDomain.PermRolesManage), handler.AssignUserRole)
		admin.POST("/roles/revoke", perm(adminDomain.PermRolesManage), handler.RevokeUserRole)
		admin.POST("/users/:id/role", perm(adminDomain.PermRolesManage), handler.AssignUserRole)
		admin.POST("/users/:id/impersonate", perm(adminDomain.PermUsersImpersonate), handler.CreateImpersonationSession)
		admin.POST("/impersonation/:id/revoke", perm(adminDomain.PermUsersImpersonate), handler.RevokeImpersonationSession)

		// System Settings & Feature Flags & Announcements
		admin.GET("/settings", perm(adminDomain.PermSystemSettings), handler.GetSystemSettings)
		admin.GET("/feature-flags", perm(adminDomain.PermFeatureFlags), handler.ListFeatureFlags)
		admin.POST("/feature-flags", perm(adminDomain.PermFeatureFlags), handler.CreateFeatureFlag)
		admin.PUT("/feature-flags/:id", perm(adminDomain.PermFeatureFlags), handler.UpdateFeatureFlag)
		admin.POST("/announcements", perm(adminDomain.PermAnnouncements), handler.CreateAnnouncement)

		// Analytics, Observability & Logs
		admin.GET("/analytics", perm(adminDomain.PermAnalyticsRead), handler.GetDashboard)
		admin.GET("/audit-logs", perm(adminDomain.PermAuditLogsRead), handler.ListAuditLogs)
		admin.GET("/security-events", perm(adminDomain.PermSecurityEventsRead), handler.ListSecurityEvents)

		admin.GET("/observability", perm(adminDomain.PermObservabilityRead), handler.GetObservabilitySummary)
		admin.GET("/observability/health", perm(adminDomain.PermObservabilityRead), handler.GetObservabilityHealth)
		admin.GET("/observability/metrics", perm(adminDomain.PermObservabilityRead), handler.GetObservabilityMetrics)
		admin.GET("/observability/errors", perm(adminDomain.PermObservabilityRead), handler.GetObservabilityErrors)
		admin.GET("/observability/incidents", perm(adminDomain.PermObservabilityRead), handler.GetObservabilityIncidents)
		admin.GET("/observability/dependencies", perm(adminDomain.PermObservabilityRead), handler.GetObservabilityHealth)
	}
}
