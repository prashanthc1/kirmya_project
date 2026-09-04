package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *RecommendationHandler) {
	// Top-level /feed endpoint
	feedGroup := api.Group("/feed")
	feedGroup.Use(sharedMiddleware.AuthRequired())
	{
		feedGroup.GET("", handler.GetFeed)
	}

	recommendations := api.Group("/recommendations")
	recommendations.Use(sharedMiddleware.AuthRequired())
	{
		recommendations.GET("", handler.GetRecommendations)
		recommendations.GET("/feed", handler.GetFeed)
		recommendations.GET("/people", handler.GetPeopleRecommendations)
		recommendations.GET("/communities", handler.GetCommunityRecommendations)
		recommendations.POST("/:id/feedback", handler.SubmitFeedback)
		recommendations.GET("/preferences", handler.GetPreferences)
		recommendations.PUT("/preferences", handler.UpdatePreferences)
	}
}

