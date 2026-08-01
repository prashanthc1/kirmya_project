package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *NotificationHandler) {
	notifications := api.Group("/notifications")
	notifications.Use(sharedMiddleware.AuthRequired())
	{
		notifications.GET("", handler.ListNotifications)
		notifications.PUT("/:id/read", handler.MarkRead)
		notifications.PUT("/read-all", handler.MarkAllRead)
		notifications.GET("/preferences", handler.GetPreferences)
		notifications.PUT("/preferences", handler.UpdatePreference)
	}
}
