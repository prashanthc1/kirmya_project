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
		notifications.GET("/unread-count", handler.GetUnreadCount)
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
		notifications.POST("/clear-read", handler.ClearRead)
		notifications.DELETE("/read", handler.ClearRead)

		notifications.GET("/digests", handler.GetPreferences)
		notifications.PUT("/digests", handler.UpdatePreference)
		notifications.GET("/schedules", handler.GetSchedules)
		notifications.POST("/schedules", handler.CreateSchedule)
		notifications.DELETE("/schedules/:id", handler.DeleteSchedule)

		notifications.GET("/:id", handler.GetByID)
		notifications.POST("/:id/read", handler.MarkRead)
		notifications.PUT("/:id/read", handler.MarkRead)
		notifications.POST("/:id/unread", handler.MarkUnread)
		notifications.DELETE("/:id", handler.DeleteNotification)
		notifications.POST("/:id/archive", handler.ArchiveNotification)
	}

	settings := api.Group("/settings/notifications")
	settings.Use(sharedMiddleware.AuthRequired())
	{
		settings.GET("", handler.GetPreferences)
		settings.PUT("", handler.UpdatePreference)
	}

	admin := api.Group("/admin/notifications")
	admin.Use(sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin())
	{
		admin.GET("", handler.ListNotifications)
		admin.GET("/templates", handler.AdminGetTemplates)
		admin.POST("/templates", handler.AdminCreateTemplate)
		admin.GET("/templates/:id", handler.AdminGetTemplateByID)
		admin.PUT("/templates/:id", handler.AdminUpdateTemplate)
		admin.POST("/templates/:id/publish", handler.AdminPublishTemplate)
		admin.POST("/templates/:id/archive", handler.AdminArchiveTemplate)
		admin.POST("/templates/:id/test", handler.AdminTestSendTemplate)
		admin.GET("/queue", handler.AdminGetQueue)
		admin.GET("/failed", handler.AdminGetFailures)
		admin.GET("/failures", handler.AdminGetFailures)
		admin.GET("/providers", handler.AdminGetProviders)
		admin.GET("/analytics", handler.AdminGetAnalytics)
		admin.GET("/delivery-analytics", handler.AdminGetDeliveryAnalytics)
		admin.GET("/dead-letters", handler.AdminListDeadLetters)
		admin.POST("/dead-letters/:id/retry", handler.AdminRetryDeadLetter)
		admin.POST("/announcement", handler.AdminSendAnnouncement)
	}

	internal := api.Group("/internal/notifications")
	{
		internal.POST("/events", handler.IngestEvent)
	}
}
