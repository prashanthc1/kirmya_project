package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ComplianceHandler) {
	complianceGroup := api.Group("/compliance")
	complianceGroup.Use(sharedMiddleware.AuthRequired())
	{
		complianceGroup.POST("/consent", handler.UpdateConsent)
		complianceGroup.GET("/consent", handler.GetUserConsents)
		complianceGroup.POST("/export", handler.RequestDataExport)
		complianceGroup.POST("/delete-account", handler.RequestAccountDeletion)
		complianceGroup.GET("/requests", handler.GetUserDataRequests)
	}
}
