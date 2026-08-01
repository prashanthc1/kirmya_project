package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *MessagingHandler) {
	messaging := api.Group("/messaging")
	messaging.Use(sharedMiddleware.AuthRequired())
	{
		messaging.GET("/ws", handler.UpgradeWS)
		messaging.GET("/conversations", handler.ListConversations)
		messaging.POST("/conversations", handler.GetOrCreateConversation)
		messaging.GET("/conversations/:id/messages", handler.ListMessages)
		messaging.POST("/conversations/:id/messages", handler.SendMessage)
	}
}
