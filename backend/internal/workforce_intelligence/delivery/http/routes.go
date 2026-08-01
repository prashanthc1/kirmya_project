package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *IntelligenceHandler) {
	intelligenceGroup := api.Group("/intelligence")
	{
		intelligenceGroup.GET("/market", handler.GetMarketInsights)
		intelligenceGroup.GET("/skills", handler.GetSkillTrends)
		intelligenceGroup.GET("/hiring-stats", handler.GetHiringStatistics)
		intelligenceGroup.GET("/user-recommendations", sharedMiddleware.AuthRequired(), handler.GetUserCareerRecommendations)
	}
}
