package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *CareerAIHandler) {
	careerAIGroup := api.Group("/career-ai")
	careerAIGroup.Use(sharedMiddleware.AuthRequired())
	{
		careerAIGroup.POST("/recommendations", handler.GenerateCareerAdvice)
		careerAIGroup.POST("/resume-feedback", handler.AnalyzeResume)
		careerAIGroup.POST("/skill-gap", handler.IdentifySkillGaps)
		careerAIGroup.POST("/job-guidance", handler.GenerateJobGuidance)
		careerAIGroup.POST("/interview-prep", handler.GenerateInterviewPrep)
		careerAIGroup.GET("/recommendations", handler.GetUserRecommendations)
		careerAIGroup.GET("/usage", handler.GetUserUsage)
	}
}
