package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *NotificationHandler, guard *authz.Guard) {
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
		admin.GET("", guard.Require(adminDomain.PermNotificationsRead), handler.ListNotifications)
		admin.GET("/templates", guard.Require(adminDomain.PermNotificationsRead), handler.AdminGetTemplates)
		admin.POST("/templates", guard.Require(adminDomain.PermNotificationsManage), handler.AdminCreateTemplate)
		admin.GET("/templates/:id", guard.Require(adminDomain.PermNotificationsRead), handler.AdminGetTemplateByID)
		admin.PUT("/templates/:id", guard.Require(adminDomain.PermNotificationsManage), handler.AdminUpdateTemplate)
		admin.POST("/templates/:id/publish", guard.Require(adminDomain.PermNotificationsManage), handler.AdminPublishTemplate)
		admin.POST("/templates/:id/archive", guard.Require(adminDomain.PermNotificationsManage), handler.AdminArchiveTemplate)
		admin.POST("/templates/:id/test", guard.Require(adminDomain.PermNotificationsManage), handler.AdminTestSendTemplate)
		admin.GET("/queue", guard.Require(adminDomain.PermNotificationsRead), handler.AdminGetQueue)
		admin.GET("/failed", guard.Require(adminDomain.PermNotificationsRead), handler.AdminGetFailures)
		admin.GET("/failures", guard.Require(adminDomain.PermNotificationsRead), handler.AdminGetFailures)
		admin.GET("/providers", guard.Require(adminDomain.PermNotificationsRead), handler.AdminGetProviders)
		admin.GET("/analytics", guard.Require(adminDomain.PermAnalyticsRead), handler.AdminGetAnalytics)
		admin.GET("/delivery-analytics", guard.Require(adminDomain.PermAnalyticsRead), handler.AdminGetDeliveryAnalytics)
		admin.GET("/dead-letters", guard.Require(adminDomain.PermNotificationsRead), handler.AdminListDeadLetters)
		admin.POST("/dead-letters/:id/retry", guard.Require(adminDomain.PermNotificationsManage), handler.AdminRetryDeadLetter)
		admin.POST("/announcement", guard.Require(adminDomain.PermAnnouncements), handler.AdminSendAnnouncement)
	}

	internal := api.Group("/internal/notifications")
	{
		internal.POST("/events", handler.IngestEvent)
	}
}
