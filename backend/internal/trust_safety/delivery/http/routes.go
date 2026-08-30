package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(router *gin.RouterGroup, handler interface{}) {
	switch h := handler.(type) {
	case *TrustSafetyHandler:
		RegisterSafetyRoutes(router, h)
		RegisterTrustRoutes(router, h)
	case *TrustHandler:
		if h != nil {
			trust := router.Group("/trust")
			trust.Use(sharedMiddleware.AuthRequired())
			{
				trust.POST("/reports", h.SubmitReport)
				trust.GET("/reports", h.GetReports)
				trust.POST("/reports/:id/action", h.ExecuteModerationAction)
			}
		}
	}
}

func RegisterTrustRoutes(router *gin.RouterGroup, handler *TrustSafetyHandler) {
	if handler == nil {
		return
	}

	trust := router.Group("/trust")
	trust.Use(sharedMiddleware.AuthRequired())
	{
		trust.POST("/reports", handler.SubmitReport)
		trust.GET("/reports", handler.GetUserReports)
		trust.GET("/reports/:id", handler.GetReportByID)
		trust.POST("/users/block", handler.BlockUser)
		trust.GET("/mutes", handler.GetUserMutes)
		trust.POST("/mutes", handler.MuteEntity)
		trust.DELETE("/mutes/:id", handler.UnmuteEntity)
	}
}

func RegisterSafetyRoutes(router *gin.RouterGroup, handler *TrustSafetyHandler) {
	if handler == nil {
		return
	}

	safety := router.Group("/safety")
	safety.Use(sharedMiddleware.AuthRequired())
	{
		safety.POST("/reports", handler.SubmitReport)
		safety.GET("/reports", handler.GetUserReports)
		safety.GET("/reports/:id", handler.GetReportByID)

		safety.POST("/blocks", handler.BlockUser)
		safety.POST("/blocks/:userId", handler.BlockUser)
		safety.DELETE("/blocks/:userId", handler.UnblockUser)
		safety.GET("/blocks", handler.GetUserBlocks)

		safety.POST("/mutes", handler.MuteEntity)
		safety.DELETE("/mutes/:id", handler.UnmuteEntity)
		safety.GET("/mutes", handler.GetUserMutes)

		safety.GET("/appeals", handler.GetUserAppeals)
		safety.POST("/appeals", handler.SubmitAppeal)
		safety.GET("/appeals/:id", handler.GetAppealByID)
		safety.GET("/restrictions", handler.GetUserRestrictions)
	}
}

func RegisterAdminSafetyRoutes(router *gin.RouterGroup, handler *AdminTrustSafetyHandler, auth *authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}

	adminTrustSafety := router.Group("/admin/trust-safety")
	if auth != nil {
		adminTrustSafety.Use(auth.RequireAuth(), auth.RequireRole("admin", "super_admin"))
	} else {
		adminTrustSafety.Use(sharedMiddleware.AuthRequired())
	}
	{
		adminTrustSafety.GET("", handler.GetAdminSummary)
		adminTrustSafety.GET("/queue", handler.GetAdminQueue)
		adminTrustSafety.GET("/reports", handler.GetAdminReports)
		adminTrustSafety.GET("/reports/:id", handler.GetReportByID)
		adminTrustSafety.PUT("/reports/:id", handler.UpdateReportStatus)
		adminTrustSafety.POST("/reports/:id/actions", handler.ApplyAction)

		adminTrustSafety.GET("/cases", handler.GetAdminCases)
		adminTrustSafety.GET("/cases/:id", handler.GetCaseByID)
		adminTrustSafety.POST("/cases/:id/claim", handler.ClaimCase)
		adminTrustSafety.POST("/cases/:id/assign", handler.AssignCase)
		adminTrustSafety.POST("/cases/:id/actions", handler.ApplyAction)

		adminTrustSafety.GET("/appeals", handler.GetAdminAppeals)
		adminTrustSafety.GET("/appeals/:id", handler.GetAppealByID)
		adminTrustSafety.PUT("/appeals/:id", handler.ResolveAppeal)
		adminTrustSafety.POST("/appeals/:id/resolve", handler.ResolveAppeal)

		adminTrustSafety.GET("/policies", handler.GetSafetyPolicies)
		adminTrustSafety.POST("/policies", handler.CreateSafetyPolicy)
		adminTrustSafety.PUT("/policies/:id", handler.UpdateSafetyPolicy)

		adminTrustSafety.GET("/workload", handler.GetModeratorWorkloads)
		adminTrustSafety.POST("/reinstatements", handler.ReinstateUser)

		adminTrustSafety.GET("/incidents", handler.GetAdminCases)
		adminTrustSafety.GET("/rules", handler.GetSafetyRules)
		adminTrustSafety.PUT("/rules", handler.UpdateSafetyRule)
		adminTrustSafety.GET("/analytics", handler.GetAnalytics)
	}

	adminSafetyLegacy := router.Group("/admin/safety")
	if auth != nil {
		adminSafetyLegacy.Use(auth.RequireAuth(), auth.RequireRole("admin", "super_admin"))
	} else {
		adminSafetyLegacy.Use(sharedMiddleware.AuthRequired())
	}
	{
		adminSafetyLegacy.GET("/cases", handler.GetAdminCases)
		adminSafetyLegacy.POST("/cases/:id/actions", handler.ApplyAction)
		adminSafetyLegacy.POST("/appeals/:id/resolve", handler.ResolveAppeal)
		adminSafetyLegacy.GET("/analytics", handler.GetAnalytics)
	}
}
