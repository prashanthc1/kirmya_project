package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *RecommendationHandler, guard *authz.Guard) {
	recommendationGroup := api.Group("/recommendation-engine")
	recommendationGroup.Use(sharedMiddleware.AuthRequired())
	{
		recommendationGroup.GET("/unified", handler.GetUnifiedRecommendations)
		recommendationGroup.POST("/events", handler.TrackEvent)
		recommendationGroup.GET("/preferences", handler.GetUserPreferences)
		recommendationGroup.POST("/preferences", handler.UpdatePreferences)
		recommendationGroup.GET("/career-gaps", handler.GetCareerGapAnalysis)
	}

	adminGroup := api.Group("/admin/recommendations")
	adminGroup.Use(sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin())
	{
		adminGroup.GET("/config", guard.Require(adminDomain.PermSystemSettings), handler.AdminGetConfig)
		adminGroup.PUT("/config", guard.Require(adminDomain.PermSystemSettings), handler.AdminUpdateConfig)
		adminGroup.GET("/metrics", guard.Require(adminDomain.PermAnalyticsRead), handler.AdminGetMetrics)
	}
}
