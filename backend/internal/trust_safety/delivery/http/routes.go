package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// RegisterRoutes mounts the user-facing trust endpoints.
//
// The parameter is a concrete *TrustHandler rather than an interface{} with a
// type switch. The previous signature accepted anything and silently mounted
// nothing when the value did not match a case, so passing the wrong handler —
// or a typed nil — produced a router with no trust routes and no error at
// startup or in any test. A wrong type is now a compile error instead of a
// silently missing set of endpoints.
//
// The *TrustSafetyHandler branch this switch also carried was unreachable:
// SetupRouter mounts that handler through RegisterSafetyRoutes directly.
func RegisterRoutes(router *gin.RouterGroup, handler *TrustHandler) {
	if handler == nil {
		return
	}

	trust := router.Group("/trust")
	trust.Use(sharedMiddleware.AuthRequired())
	{
		trust.POST("/reports", handler.SubmitReport)
		trust.GET("/reports", handler.GetReports)
		// Executing a moderation action is an administrative capability, not
		// something any signed-in user may do to another user's report.
		trust.POST("/reports/:id/action", sharedMiddleware.RequireAdmin(), handler.ExecuteModerationAction)
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
	adminTrustSafety.Use(sharedMiddleware.RequireAdmin())
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
	adminSafetyLegacy.Use(sharedMiddleware.RequireAdmin())
	{
		adminSafetyLegacy.GET("/cases", handler.GetAdminCases)
		adminSafetyLegacy.POST("/cases/:id/actions", handler.ApplyAction)
		adminSafetyLegacy.POST("/appeals/:id/resolve", handler.ResolveAppeal)
		adminSafetyLegacy.GET("/analytics", handler.GetAnalytics)
	}
}
