package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ApplicationsHandler) {
	appGroup := api.Group("/applications")
	appGroup.Use(sharedMiddleware.AuthRequired())
	{
		appGroup.GET("", handler.GetApplications)
		appGroup.POST("", handler.ApplyToJob)
		appGroup.GET("/analytics", handler.GetAnalytics)
		appGroup.GET("/ai-insights", handler.GetAIInsights)
		appGroup.GET("/:id", handler.GetApplicationByID)
		appGroup.PUT("/:id/withdraw", handler.WithdrawApplication)
		appGroup.GET("/:id/timeline", handler.GetApplicationTimeline)
	}

	jobApplyGroup := api.Group("/jobs/:id/apply")
	jobApplyGroup.Use(sharedMiddleware.AuthRequired())
	{
		jobApplyGroup.POST("", handler.ApplyToJob)
	}

	savedGroup := api.Group("/jobs/saved")
	savedGroup.Use(sharedMiddleware.AuthRequired())
	{
		savedGroup.GET("", handler.GetSavedJobs)
	}

	jobSaveGroup := api.Group("/jobs/:id/save")
	jobSaveGroup.Use(sharedMiddleware.AuthRequired())
	{
		jobSaveGroup.POST("", handler.SaveJob)
		jobSaveGroup.DELETE("", handler.RemoveSavedJob)
	}

	docGroup := api.Group("/documents")
	docGroup.Use(sharedMiddleware.AuthRequired())
	{
		docGroup.GET("", handler.GetCandidateDocuments)
		docGroup.POST("/upload", handler.UploadDocument)
		docGroup.DELETE("/:id", handler.DeleteDocument)
	}
}
