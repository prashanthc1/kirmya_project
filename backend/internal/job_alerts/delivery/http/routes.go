package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *JobAlertsHandler) {
	alertGroup := api.Group("/job-alerts")
	alertGroup.Use(sharedMiddleware.AuthRequired())
	{
		alertGroup.GET("", handler.GetJobAlerts)
		alertGroup.POST("", handler.CreateJobAlert)
		alertGroup.GET("/history", handler.GetAlertHistory)
		alertGroup.PUT("/:id", handler.UpdateJobAlert)
		alertGroup.DELETE("/:id", handler.DeleteJobAlert)
		alertGroup.POST("/:id/pause", handler.PauseJobAlert)
		alertGroup.POST("/:id/resume", handler.ResumeJobAlert)
	}

	recGroup := api.Group("/job-recommendations")
	recGroup.Use(sharedMiddleware.AuthRequired())
	{
		recGroup.GET("", handler.GetJobRecommendations)
		recGroup.GET("/:id", handler.GetJobRecommendationByID)
		recGroup.POST("/:id/feedback", handler.SubmitRecommendationFeedback)
	}

	searchGroup := api.Group("/saved-searches")
	searchGroup.Use(sharedMiddleware.AuthRequired())
	{
		searchGroup.GET("", handler.GetSavedSearches)
		searchGroup.POST("", handler.CreateSavedSearch)
		searchGroup.PUT("/:id", handler.UpdateSavedSearch)
		searchGroup.DELETE("/:id", handler.DeleteSavedSearch)
	}

	insightsGroup := api.Group("/career-insights")
	insightsGroup.Use(sharedMiddleware.AuthRequired())
	{
		insightsGroup.GET("", handler.GetCareerInsights)
	}
}
