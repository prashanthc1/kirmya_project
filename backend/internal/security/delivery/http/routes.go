package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterSecurityRoutes(router *gin.RouterGroup, handler *SecurityHandler) {
	security := router.Group("/security")
	security.Use(sharedMiddleware.AuthRequired())
	{
		security.GET("", handler.GetSecurityOverview)
		security.POST("/password/change", handler.ChangePassword)
		security.POST("/password/validate", handler.ValidatePasswordPolicy)
		security.POST("/mfa/setup", handler.SetupMFA)
		security.POST("/mfa/verify", handler.VerifyMFA)
		security.POST("/mfa/disable", handler.DisableMFA)
		security.GET("/sessions", handler.GetActiveSessions)
		security.DELETE("/sessions/:id", handler.RevokeSession)
		security.DELETE("/sessions", handler.RevokeAllOtherSessions)
		security.GET("/devices", handler.GetTrustedDevices)
		security.POST("/devices", handler.RegisterDevice)
		security.PUT("/devices/:id", handler.UpdateDeviceTrustStatus)
		security.DELETE("/devices/:id", handler.RemoveDevice)
		security.GET("/login-history", handler.GetLoginHistory)
		security.GET("/api-keys", handler.GetAPIKeys)
		security.POST("/api-keys", handler.CreateAPIKey)
		security.DELETE("/api-keys/:id", handler.RevokeAPIKey)
		security.GET("/events", handler.GetSecurityEvents)
		security.GET("/risk-score", handler.GetAccountRiskScore)
	}

	privacy := router.Group("/privacy")
	privacy.Use(sharedMiddleware.AuthRequired())
	{
		privacy.GET("/settings", handler.GetPrivacySettings)
		privacy.PUT("/settings", handler.UpdatePrivacySettings)
	}
}

func RegisterAdminSecurityRoutes(router *gin.RouterGroup, handler *AdminSecurityHandler, auth ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}
	adminSecurity := router.Group("/admin/security")
	adminSecurity.Use(sharedMiddleware.RequireAdmin())
	{
		adminSecurity.GET("", handler.GetAdminSecuritySummary)
		adminSecurity.GET("/events", handler.GetSecurityEvents)
		adminSecurity.GET("/incidents", handler.GetSecurityIncidents)
		adminSecurity.POST("/incidents", handler.CreateSecurityIncident)
		adminSecurity.GET("/incidents/:id", handler.GetSecurityIncidentByID)
		adminSecurity.PUT("/incidents/:id", handler.UpdateSecurityIncident)
		adminSecurity.GET("/settings", handler.GetSecuritySettings)
		adminSecurity.PUT("/settings", handler.UpdateSecuritySettings)
		adminSecurity.GET("/alerts", handler.GetSecurityAlerts)
		adminSecurity.GET("/alerts/:id", handler.GetSecurityAlertByID)
		adminSecurity.PUT("/alerts/:id", handler.UpdateSecurityAlert)
		adminSecurity.POST("/alerts/:id/resolve", handler.ResolveSecurityAlert)
		adminSecurity.GET("/rules", handler.GetSecurityRules)
		adminSecurity.PUT("/rules/:id", handler.UpdateSecurityRule)
		adminSecurity.GET("/bot-signals", handler.GetBotSignals)
		adminSecurity.GET("/fraud-alerts", handler.GetFraudAlerts)
		adminSecurity.GET("/risk-scores", handler.GetAccountRiskScores)
	}
}
