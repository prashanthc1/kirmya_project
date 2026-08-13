package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(router *gin.RouterGroup, handler interface{}) {
	if h, ok := handler.(*TrustSafetyHandler); ok {
		RegisterSafetyRoutes(router, h)
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
	}
}

func RegisterAdminSafetyRoutes(router *gin.RouterGroup, handler *AdminTrustSafetyHandler) {
	if handler == nil {
		return
	}

	adminTrustSafety := router.Group("/admin/trust-safety")
	adminTrustSafety.Use(sharedMiddleware.AuthRequired())
	{
		adminTrustSafety.GET("", handler.GetAdminSummary)
		adminTrustSafety.GET("/reports", handler.GetAdminReports)
		adminTrustSafety.GET("/reports/:id", handler.GetReportByID)
		adminTrustSafety.PUT("/reports/:id", handler.UpdateReportStatus)
		adminTrustSafety.POST("/reports/:id/actions", handler.ApplyAction)

		adminTrustSafety.GET("/cases", handler.GetAdminCases)
		adminTrustSafety.POST("/cases/:id/actions", handler.ApplyAction)

		adminTrustSafety.GET("/appeals", handler.GetAdminAppeals)
		adminTrustSafety.GET("/appeals/:id", handler.GetAppealByID)
		adminTrustSafety.PUT("/appeals/:id", handler.ResolveAppeal)
		adminTrustSafety.POST("/appeals/:id/resolve", handler.ResolveAppeal)

		adminTrustSafety.GET("/incidents", handler.GetAdminCases)
		adminTrustSafety.GET("/rules", handler.GetSafetyRules)
		adminTrustSafety.PUT("/rules", handler.UpdateSafetyRule)
		adminTrustSafety.GET("/analytics", handler.GetAnalytics)
	}

	adminSafetyLegacy := router.Group("/admin/safety")
	adminSafetyLegacy.Use(sharedMiddleware.AuthRequired())
	{
		adminSafetyLegacy.GET("/cases", handler.GetAdminCases)
		adminSafetyLegacy.POST("/cases/:id/actions", handler.ApplyAction)
		adminSafetyLegacy.POST("/appeals/:id/resolve", handler.ResolveAppeal)
		adminSafetyLegacy.GET("/analytics", handler.GetAnalytics)
	}
}
