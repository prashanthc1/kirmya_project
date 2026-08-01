package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *RecruiterAIHandler) {
	recruiterAIGroup := api.Group("/recruiter-ai")
	recruiterAIGroup.Use(sharedMiddleware.AuthRequired())
	{
		recruiterAIGroup.POST("/rank-candidates", handler.RankCandidates)
		recruiterAIGroup.POST("/interview-questions", handler.GenerateInterviewQuestions)
		recruiterAIGroup.POST("/optimize-jd", handler.OptimizeJobDescription)
		recruiterAIGroup.POST("/outreach-email", handler.DraftOutreachEmail)
		recruiterAIGroup.GET("/sessions", handler.GetRecruiterSessions)
	}
}
