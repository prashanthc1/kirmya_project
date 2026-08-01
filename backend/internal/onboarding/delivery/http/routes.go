package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(api *gin.RouterGroup, handler *OnboardingHandler) {
	onboardingGroup := api.Group("/onboarding")
	{
		onboardingGroup.GET("", handler.GetProgress)
		onboardingGroup.POST("/start", handler.StartOnboarding)
		onboardingGroup.PUT("/save", handler.SaveProgress)
		onboardingGroup.POST("/complete", handler.CompleteOnboarding)
		onboardingGroup.GET("/communities", handler.GetCommunities)
		onboardingGroup.GET("/connections", handler.GetConnections)
	}

	api.GET("/profile/completion", handler.GetProfileCompletion)
	api.POST("/profile/photo", handler.UploadProfilePhoto)
	api.POST("/resume/upload", handler.UploadResume)
	api.POST("/skills", handler.SaveSkills)
	api.POST("/work-experience", handler.SaveWorkExperience)
	api.POST("/education", handler.SaveEducation)
	api.POST("/certifications", handler.SaveCertifications)
	api.POST("/career-preferences", handler.SaveCareerPreferences)
}
