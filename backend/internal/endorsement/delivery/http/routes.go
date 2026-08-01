package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *EndorsementHandler) {
	endorsementsGroup := api.Group("/endorsements")
	endorsementsGroup.Use(sharedMiddleware.AuthRequired())
	{
		endorsementsGroup.POST("/skills", handler.EndorseSkill)
		endorsementsGroup.GET("/skills", handler.GetUserEndorsements)
		endorsementsGroup.POST("/recommendations", handler.SubmitRecommendation)
		endorsementsGroup.GET("/recommendations", handler.GetRecommendationsForUser)
		endorsementsGroup.PUT("/recommendations/:id/status", handler.UpdateRecommendationStatus)
		endorsementsGroup.POST("/references", handler.CreateReference)
		endorsementsGroup.GET("/references", handler.GetUserReferences)
	}
}
