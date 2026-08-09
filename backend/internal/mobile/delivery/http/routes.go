package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *MobileHandler) *gin.RouterGroup {
	mobileGroup := api.Group("/mobile")
	{
		mobileGroup.GET("/config", handler.GetMobileConfig)
		mobileGroup.GET("/docs", handler.GetOpenAPIDocs)
		mobileGroup.POST("/devices", sharedMiddleware.AuthRequired(), handler.RegisterDevice)
		mobileGroup.POST("/uploads/presign", sharedMiddleware.AuthRequired(), handler.CreatePresignedUpload)
	}
	return mobileGroup
}
