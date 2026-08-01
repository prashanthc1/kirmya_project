package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *MatchingHandler) {
	jobMatchGroup := api.Group("/jobs/matches")
	jobMatchGroup.Use(sharedMiddleware.AuthRequired())
	{
		jobMatchGroup.GET("", handler.GetUserMatches)
		jobMatchGroup.GET("/:id", handler.GetMatchByID)
		jobMatchGroup.POST("/:id/feedback", handler.SubmitFeedback)
	}
}
