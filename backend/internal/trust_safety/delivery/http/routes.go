package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, handler interface{}) {
	if h, ok := handler.(*TrustSafetyHandler); ok {
		RegisterSafetyRoutes(router, h)
	}
}

func RegisterSafetyRoutes(router *gin.RouterGroup, handler *TrustSafetyHandler) {
	var submitReport, getUserReports, blockUser, unblockUser, getUserBlocks, submitAppeal gin.HandlerFunc
	if handler != nil {
		submitReport = handler.SubmitReport
		getUserReports = handler.GetUserReports
		blockUser = handler.BlockUser
		unblockUser = handler.UnblockUser
		getUserBlocks = handler.GetUserBlocks
		submitAppeal = handler.SubmitAppeal
	} else {
		dummy := func(c *gin.Context) {}
		submitReport, getUserReports, blockUser, unblockUser, getUserBlocks, submitAppeal = dummy, dummy, dummy, dummy, dummy, dummy
	}

	safety := router.Group("/safety")
	{
		safety.POST("/reports", submitReport)
		safety.GET("/reports", getUserReports)
		safety.POST("/blocks/:userId", blockUser)
		safety.DELETE("/blocks/:userId", unblockUser)
		safety.GET("/blocks", getUserBlocks)
		safety.POST("/appeals", submitAppeal)
	}
}

func RegisterAdminSafetyRoutes(router *gin.RouterGroup, handler *AdminTrustSafetyHandler) {
	var getAdminCases, applyAction, resolveAppeal, getAnalytics gin.HandlerFunc
	if handler != nil {
		getAdminCases = handler.GetAdminCases
		applyAction = handler.ApplyAction
		resolveAppeal = handler.ResolveAppeal
		getAnalytics = handler.GetAnalytics
	} else {
		dummy := func(c *gin.Context) {}
		getAdminCases, applyAction, resolveAppeal, getAnalytics = dummy, dummy, dummy, dummy
	}

	adminSafety := router.Group("/admin/safety")
	{
		adminSafety.GET("/cases", getAdminCases)
		adminSafety.POST("/cases/:id/actions", applyAction)
		adminSafety.POST("/appeals/:id/resolve", resolveAppeal)
		adminSafety.GET("/analytics", getAnalytics)
	}
}
