package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
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

func RegisterAdminSecurityRoutes(router *gin.RouterGroup, handler *AdminSecurityHandler, guard *authz.Guard, auth ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}
	adminSecurity := router.Group("/admin/security")
	adminSecurity.Use(sharedMiddleware.RequireAdmin())
	{
		adminSecurity.GET("", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetAdminSecuritySummary)
		adminSecurity.GET("/events", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetSecurityEvents)
		adminSecurity.GET("/incidents", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetSecurityIncidents)
		adminSecurity.POST("/incidents", guard.Require(adminDomain.PermSecurityManage), handler.CreateSecurityIncident)
		adminSecurity.GET("/incidents/:id", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetSecurityIncidentByID)
		adminSecurity.PUT("/incidents/:id", guard.Require(adminDomain.PermSecurityManage), handler.UpdateSecurityIncident)
		adminSecurity.GET("/settings", guard.Require(adminDomain.PermSecurityManage), handler.GetSecuritySettings)
		adminSecurity.PUT("/settings", guard.Require(adminDomain.PermSecurityManage), handler.UpdateSecuritySettings)
		adminSecurity.GET("/alerts", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetSecurityAlerts)
		adminSecurity.GET("/alerts/:id", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetSecurityAlertByID)
		adminSecurity.PUT("/alerts/:id", guard.Require(adminDomain.PermSecurityManage), handler.UpdateSecurityAlert)
		adminSecurity.POST("/alerts/:id/resolve", guard.Require(adminDomain.PermSecurityManage), handler.ResolveSecurityAlert)
		adminSecurity.GET("/rules", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetSecurityRules)
		adminSecurity.PUT("/rules/:id", guard.Require(adminDomain.PermSecurityManage), handler.UpdateSecurityRule)
		adminSecurity.GET("/bot-signals", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetBotSignals)
		adminSecurity.GET("/fraud-alerts", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetFraudAlerts)
		adminSecurity.GET("/risk-scores", guard.Require(adminDomain.PermSecurityEventsRead), handler.GetAccountRiskScores)
	}
}
