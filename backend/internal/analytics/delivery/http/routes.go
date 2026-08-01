package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *AnalyticsHandler) {
	analytics := api.Group("/analytics")
	analytics.Use(sharedMiddleware.AuthRequired())
	{
		analytics.POST("/events", handler.TrackEvent)
		analytics.GET("/admin", handler.GetAdminAnalytics)
		analytics.GET("/recruiter", handler.GetRecruiterAnalytics)
		analytics.GET("/user", handler.GetUserAnalytics)
	}
}
