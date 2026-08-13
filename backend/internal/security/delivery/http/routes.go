package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterSecurityRoutes(router *gin.RouterGroup, handler *SecurityHandler) {
	security := router.Group("/security")
	security.Use(sharedMiddleware.AuthRequired())
	{
		security.GET("", handler.GetSecurityOverview)
		security.POST("/password/change", handler.ChangePassword)
		security.POST("/mfa/setup", handler.SetupMFA)
		security.POST("/mfa/verify", handler.VerifyMFA)
		security.POST("/mfa/disable", handler.DisableMFA)
		security.GET("/sessions", handler.GetActiveSessions)
		security.DELETE("/sessions/:id", handler.RevokeSession)
		security.DELETE("/sessions", handler.RevokeAllOtherSessions)
		security.GET("/devices", handler.GetTrustedDevices)
		security.PUT("/devices/:id", handler.UpdateDeviceTrustStatus)
		security.DELETE("/devices/:id", handler.RemoveDevice)
		security.GET("/login-history", handler.GetLoginHistory)
		security.GET("/api-keys", handler.GetAPIKeys)
		security.POST("/api-keys", handler.CreateAPIKey)
		security.DELETE("/api-keys/:id", handler.RevokeAPIKey)
		security.GET("/events", handler.GetSecurityEvents)
	}
}

func RegisterAdminSecurityRoutes(router *gin.RouterGroup, handler *AdminSecurityHandler) {
	adminSecurity := router.Group("/admin/security")
	adminSecurity.Use(sharedMiddleware.AuthRequired())
	{
		adminSecurity.GET("", handler.GetAdminSecuritySummary)
		adminSecurity.GET("/events", handler.GetSecurityEvents)
		adminSecurity.GET("/incidents", handler.GetSecurityIncidents)
		adminSecurity.POST("/incidents", handler.CreateSecurityIncident)
		adminSecurity.GET("/incidents/:id", handler.GetSecurityIncidentByID)
		adminSecurity.PUT("/incidents/:id", handler.UpdateSecurityIncident)
		adminSecurity.GET("/settings", handler.GetSecuritySettings)
		adminSecurity.PUT("/settings", handler.UpdateSecuritySettings)
	}
}
