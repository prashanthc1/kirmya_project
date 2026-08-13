package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, handler interface{}) {
	if h, ok := handler.(*TrustSafetyHandler); ok && h != nil {
		RegisterSafetyRoutes(router, h)
	}
}

func RegisterSafetyRoutes(router *gin.RouterGroup, handler *TrustSafetyHandler) {
	if handler == nil {
		return
	}
	safety := router.Group("/safety")
	{
		safety.POST("/reports", handler.SubmitReport)
		safety.GET("/reports", handler.GetUserReports)
		safety.POST("/blocks/:userId", handler.BlockUser)
		safety.DELETE("/blocks/:userId", handler.UnblockUser)
		safety.GET("/blocks", handler.GetUserBlocks)
		safety.POST("/appeals", handler.SubmitAppeal)
	}
}

func RegisterAdminSafetyRoutes(router *gin.RouterGroup, handler *AdminTrustSafetyHandler) {
	if handler == nil {
		return
	}
	adminSafety := router.Group("/admin/safety")
	{
		adminSafety.GET("/cases", handler.GetAdminCases)
		adminSafety.POST("/cases/:id/actions", handler.ApplyAction)
		adminSafety.POST("/appeals/:id/resolve", handler.ResolveAppeal)
		adminSafety.GET("/analytics", handler.GetAnalytics)
	}
}
