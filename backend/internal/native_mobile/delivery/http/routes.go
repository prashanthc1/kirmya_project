package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(mobileGroup *gin.RouterGroup, handler *NativeMobileHandler) {
	mobileGroup.POST("/auth/refresh", handler.RefreshToken)
	mobileGroup.POST("/devices/register", sharedMiddleware.AuthRequired(), handler.RegisterDevice)
	mobileGroup.POST("/push/send", sharedMiddleware.AuthRequired(), handler.SendPushNotification)

	userMobileGroup := mobileGroup.Group("/user")
	userMobileGroup.Use(sharedMiddleware.AuthRequired())
	{
		userMobileGroup.GET("/profile", handler.GetMobileUserProfile)
		userMobileGroup.GET("/jobs", handler.GetMobileUserJobs)
		userMobileGroup.GET("/applications", handler.GetMobileUserApplications)
		userMobileGroup.GET("/messages", handler.GetMobileUserMessages)
		userMobileGroup.GET("/notifications", handler.GetMobileUserNotifications)
	}
}
