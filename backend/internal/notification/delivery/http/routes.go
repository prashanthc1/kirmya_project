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
		notifications.GET("/unread", handler.ListNotifications)
		notifications.GET("/count", handler.GetUnreadCount)
		notifications.GET("/history", handler.GetHistory)
		notifications.GET("/preferences", handler.GetPreferences)
		notifications.PUT("/preferences", handler.UpdatePreference)
		notifications.GET("/preferences/categories", handler.GetPreferences)
		notifications.PUT("/preferences/categories/:category", handler.UpdatePreference)
		notifications.GET("/quiet-hours", handler.GetQuietHours)
		notifications.PUT("/quiet-hours", handler.UpdateQuietHours)
		notifications.GET("/devices", handler.GetDevices)
		notifications.POST("/devices", handler.RegisterDevice)
		notifications.DELETE("/devices/:id", handler.DeleteDevice)
		notifications.POST("/read-all", handler.MarkAllRead)
		notifications.PUT("/read-all", handler.MarkAllRead)

		notifications.GET("/:id", handler.GetByID)
		notifications.POST("/:id/read", handler.MarkRead)
		notifications.PUT("/:id/read", handler.MarkRead)
		notifications.POST("/:id/unread", handler.MarkUnread)
		notifications.DELETE("/:id", handler.DeleteNotification)
		notifications.POST("/:id/archive", handler.ArchiveNotification)
	}

	admin := api.Group("/admin/notifications")
	admin.Use(sharedMiddleware.AuthRequired())
	{
		admin.GET("", handler.ListNotifications)
		admin.GET("/templates", handler.AdminGetTemplates)
		admin.POST("/templates", handler.AdminCreateTemplate)
		admin.GET("/analytics", handler.AdminGetAnalytics)
		admin.GET("/failures", handler.AdminGetFailures)
		admin.POST("/announcement", handler.AdminSendAnnouncement)
	}
}
