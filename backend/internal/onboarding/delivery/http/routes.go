package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"

	authMiddlewarePkg "kirmya/internal/auth/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *OnboardingHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	group := api.Group("", authMiddleware.OptionalAuth())

	onboardingGroup := group.Group("/onboarding")
	{
		onboardingGroup.GET("", handler.GetProgress)
		onboardingGroup.POST("/start", handler.StartOnboarding)
		onboardingGroup.GET("/progress", handler.GetProgress)
		onboardingGroup.PUT("/progress", handler.SaveProgress)
		onboardingGroup.PUT("/save", handler.SaveProgress)
		onboardingGroup.POST("/steps/:stepId/complete", handler.CompleteStep)
		onboardingGroup.POST("/steps/:stepId/skip", handler.SkipStep)
		onboardingGroup.POST("/resume", handler.ResumeOnboarding)
		onboardingGroup.POST("/finish", handler.CompleteOnboarding)
		onboardingGroup.POST("/complete", handler.CompleteOnboarding)
		onboardingGroup.POST("/recruiter", handler.SaveRecruiterOnboarding)
		onboardingGroup.POST("/employer", handler.SaveEmployerOnboarding)
		onboardingGroup.GET("/communities", handler.GetCommunities)
		onboardingGroup.GET("/connections", handler.GetConnections)
	}

	group.GET("/profile/completion", handler.GetProfileCompletion)
	group.POST("/profile/photo", handler.UploadProfilePhoto)
	group.POST("/resume/upload", handler.UploadResume)
	group.POST("/skills", handler.SaveSkills)
	group.POST("/work-experience", handler.SaveWorkExperience)
	group.POST("/education", handler.SaveEducation)
	group.POST("/certifications", handler.SaveCertifications)
	group.POST("/career-preferences", handler.SaveCareerPreferences)

	// Admin endpoints
	adminGroup := api.Group("/admin/onboarding")
	adminGroup.Use(sharedMiddleware.RequireAdmin())
	{
		adminGroup.GET("", handler.GetAnalyticsSummary)
		adminGroup.GET("/analytics", handler.GetAnalyticsSummary)
		adminGroup.GET("/config", handler.GetStepConfigs)
		adminGroup.PUT("/config", handler.UpdateStepConfigs)
	}
}
