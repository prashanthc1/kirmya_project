package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *VerificationHandler) {
	verificationGroup := api.Group("/verifications")
	verificationGroup.Use(sharedMiddleware.AuthRequired())
	{
		verificationGroup.POST("/requests", handler.CreateRequest)
		verificationGroup.GET("/requests", handler.GetUserRequests)
		verificationGroup.GET("/status", handler.GetStatus)
		verificationGroup.PUT("/privacy", handler.UpdatePrivacy)
		verificationGroup.POST("/documents", handler.AddDocument)
	}
}
