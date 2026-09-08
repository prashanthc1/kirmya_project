package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *MessagingHandler) {
	// Standard /messages endpoints
	messages := api.Group("/messages")
	messages.Use(sharedMiddleware.AuthRequired())
	{
		messages.GET("/ws", handler.UpgradeWS)
		messages.GET("/conversations", handler.ListConversations)
		messages.POST("/conversations", handler.GetOrCreateConversation)
		messages.GET("/conversations/:id/messages", handler.ListMessages)
		messages.POST("/conversations/:id/messages", handler.SendMessage)
		messages.POST("/conversations/:id/archive", handler.ArchiveConversation)
		messages.POST("/conversations/:id/mute", handler.MuteConversation)
		messages.POST("/conversations/:id/pin", handler.PinConversation)
		messages.POST("/conversations/:id/read", handler.MarkMessagesRead)
		messages.POST("/messages/:id/reaction", handler.AddReaction)

		messages.GET("/requests", handler.ListIncomingRequests)
		messages.POST("/requests", handler.SendMessageRequest)
		messages.POST("/requests/:id/accept", handler.AcceptRequest)
		messages.POST("/requests/:id/decline", handler.DeclineRequest)

		messages.GET("/search", handler.SearchMessages)
		messages.POST("/report", handler.ReportMessage)
	}

	// The /messaging prefix duplicated five of the routes above. No client
	// addressed it - the web app uses /messages throughout - so it is gone
	// rather than kept as a second name for the same handlers.

	// Admin messaging desk
	admin := api.Group("/admin/messaging")
	admin.Use(sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin())
	{
		admin.GET("/analytics", handler.GetAdminAnalytics)
		admin.GET("/reports", handler.GetAdminReports)
	}
}
