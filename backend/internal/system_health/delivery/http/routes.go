package http

import (
	"github.com/gin-gonic/gin"
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

func RegisterAdminHealthRoutes(api *gin.RouterGroup, handler *SystemHealthHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	adminHealth := api.Group("/admin/system/health")
	adminHealth.Use(sharedMiddleware.AuthRequired())
	{
		adminHealth.GET("", handler.GetAdminHealthSummary)
		adminHealth.POST("/self-healing", handler.ExecuteSelfHealing)
		adminHealth.POST("/maintenance", handler.ToggleMaintenanceMode)
		adminHealth.POST("/diagnostics/report", handler.GenerateDiagnosticReport)
		adminHealth.GET("/incidents", handler.ListIncidents)
		adminHealth.GET("/recoveries", handler.ListRecoveryActions)
	}
}
