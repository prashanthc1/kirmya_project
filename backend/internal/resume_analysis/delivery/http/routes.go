package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ResumeAnalysisHandler) {
	resumeAnalysisGroup := api.Group("/resume-analysis")
	resumeAnalysisGroup.Use(sharedMiddleware.AuthRequired())
	{
		resumeAnalysisGroup.POST("/analyze", handler.AnalyzeResume)
		resumeAnalysisGroup.GET("/history", handler.GetUserAnalysisHistory)
		resumeAnalysisGroup.GET("/:id", handler.GetAnalysisByID)
	}
}
