package http

import (
	"github.com/gin-gonic/gin"

	authMiddlewarePkg "kirmya/internal/auth/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *OnboardingHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	// Onboarding starts before a user necessarily has a session, so the routes
	// run under OptionalAuth: a bearer token binds the request to the real user,
	// and anything anonymous falls back to the demo user in the handler.
	group := api.Group("", authMiddleware.OptionalAuth())

	onboardingGroup := group.Group("/onboarding")
	{
		onboardingGroup.GET("", handler.GetProgress)
		onboardingGroup.POST("/start", handler.StartOnboarding)
		onboardingGroup.PUT("/save", handler.SaveProgress)
		onboardingGroup.POST("/complete", handler.CompleteOnboarding)
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
}
