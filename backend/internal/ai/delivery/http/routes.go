package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *AIHandler) {
	aiGroup := api.Group("/ai")
	aiGroup.Use(sharedMiddleware.AuthRequired())
	{
		aiGroup.GET("/preferences", handler.GetPreferences)
		aiGroup.PUT("/preferences", handler.UpdatePreferences)
		aiGroup.POST("/resume-analysis", handler.AnalyzeResume)
		aiGroup.POST("/skill-gap", handler.AnalyzeSkillGap)
		aiGroup.POST("/job-matching", handler.MatchJob)
		aiGroup.POST("/interview-prep", handler.PrepareInterview)
		aiGroup.POST("/career-suggestions", handler.SuggestCareer)
	}
}
