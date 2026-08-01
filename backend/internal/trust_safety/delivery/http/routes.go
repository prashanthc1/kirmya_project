package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *TrustHandler) {
	trustGroup := api.Group("/trust")
	trustGroup.Use(sharedMiddleware.AuthRequired())
	{
		trustGroup.POST("/reports", handler.SubmitReport)
		trustGroup.GET("/reports", handler.GetReports)
		trustGroup.POST("/reports/:id/action", handler.ExecuteModerationAction)
		trustGroup.POST("/users/block", handler.BlockUser)
		trustGroup.GET("/fraud-logs", handler.GetFraudLogs)
		trustGroup.GET("/verification", handler.GetBadges)
	}
}
