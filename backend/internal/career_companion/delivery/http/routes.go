package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *CompanionHandler) {
	companionGroup := api.Group("/career-companion")
	companionGroup.Use(sharedMiddleware.AuthRequired())
	{
		companionGroup.POST("/conversations", handler.CreateConversation)
		companionGroup.POST("/conversations/:id/messages", handler.SendMessage)
		companionGroup.GET("/conversations", handler.GetUserConversations)
		companionGroup.POST("/roadmap", handler.GenerateRoadmap)
		companionGroup.GET("/roadmap", handler.GetLatestCareerPlan)
		companionGroup.GET("/context", handler.GetUserContext)
	}
}
