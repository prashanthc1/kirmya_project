package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterPublicHealthRoutes(engine *gin.Engine, handler *SystemHealthHandler) {
	health := engine.Group("/health")
	{
		health.GET("", handler.GetPublicReadiness)
		health.GET("/live", handler.GetPublicLiveness)
		health.GET("/ready", handler.GetPublicReadiness)
		health.GET("/startup", handler.GetPublicStartup)
	}

	engine.GET("/status", handler.GetPublicStatus)
}

func RegisterAdminHealthRoutes(api *gin.RouterGroup, handler *SystemHealthHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware, guard *authz.Guard) {
	if handler == nil {
		return
	}
	adminHealth := api.Group("/admin/system/health")
	adminHealth.Use(sharedMiddleware.RequireAdmin())
	{
		adminHealth.GET("", guard.Require(adminDomain.PermObservabilityRead), handler.GetAdminHealthSummary)
		adminHealth.POST("/self-healing", guard.Require(adminDomain.PermIncidentsManage), handler.ExecuteSelfHealing)
		adminHealth.POST("/maintenance", guard.Require(adminDomain.PermMaintenanceManage), handler.ToggleMaintenanceMode)
		adminHealth.POST("/diagnostics/report", guard.Require(adminDomain.PermIncidentsManage), handler.GenerateDiagnosticReport)
		adminHealth.GET("/incidents", guard.Require(adminDomain.PermIncidentsManage), handler.ListIncidents)
		adminHealth.GET("/recoveries", guard.Require(adminDomain.PermObservabilityRead), handler.ListRecoveryActions)
	}
}
