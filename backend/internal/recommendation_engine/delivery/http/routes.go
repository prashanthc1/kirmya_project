package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *RecommendationHandler) {
	recommendationGroup := api.Group("/recommendation-engine")
	recommendationGroup.Use(sharedMiddleware.AuthRequired())
	{
		recommendationGroup.GET("/unified", handler.GetUnifiedRecommendations)
		recommendationGroup.POST("/events", handler.TrackEvent)
		recommendationGroup.GET("/preferences", handler.GetUserPreferences)
		recommendationGroup.POST("/preferences", handler.UpdatePreferences)
	}
}
