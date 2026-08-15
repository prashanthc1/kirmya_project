package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ProfileHandler) {
	// Singular /profile group
	profileGroup := api.Group("/profile")
	protectedSingular := profileGroup.Group("")
	protectedSingular.Use(sharedMiddleware.AuthRequired())
	{
		protectedSingular.GET("/me", handler.GetMyProfile)
		protectedSingular.PUT("/me", handler.UpdateProfile)
		protectedSingular.GET("/me/preview", handler.GetProfilePreview)
		protectedSingular.PUT("/me/about", handler.UpdateAbout)
		protectedSingular.PUT("/me/headline", handler.UpdateHeadline)

		// Work Experience
		protectedSingular.POST("/me/experience", handler.AddWorkExperience)
		protectedSingular.PUT("/me/experience/:id", handler.UpdateWorkExperience)
		protectedSingular.DELETE("/me/experience/:id", handler.DeleteWorkExperience)

		// Education
		protectedSingular.POST("/me/education", handler.AddEducation)
		protectedSingular.PUT("/me/education/:id", handler.UpdateEducation)
		protectedSingular.DELETE("/me/education/:id", handler.DeleteEducation)

		// Skills
		protectedSingular.POST("/me/skills", handler.AddSkill)
		protectedSingular.DELETE("/me/skills/:id", handler.DeleteSkill)

		// Certifications
		protectedSingular.POST("/me/certifications", handler.AddCertification)
		protectedSingular.DELETE("/me/certifications/:id", handler.DeleteCertification)

		// Projects
		protectedSingular.POST("/me/projects", handler.AddProject)
		protectedSingular.DELETE("/me/projects/:id", handler.DeleteProject)

		// Languages & Achievements
		protectedSingular.POST("/me/languages", handler.AddLanguage)
		protectedSingular.DELETE("/me/languages/:id", handler.DeleteLanguage)
		protectedSingular.POST("/me/achievements", handler.AddAchievement)
		protectedSingular.DELETE("/me/achievements/:id", handler.DeleteAchievement)

		// Media & Privacy
		protectedSingular.POST("/me/photo", handler.UploadPhoto)
		protectedSingular.DELETE("/me/photo", handler.DeletePhoto)
		protectedSingular.PUT("/me/privacy", handler.UpdatePreferences)

		// Profile Enhancements & Identity
		protectedSingular.GET("/me/completeness", handler.GetCompleteness)
		protectedSingular.POST("/me/verification", handler.RequestVerification)
		protectedSingular.PUT("/me/career-preferences", handler.UpdateCareerPreferences)
		protectedSingular.GET("/me/resume-consistency", handler.GetResumeConsistency)
		protectedSingular.GET("/me/analytics", handler.GetAnalytics)
	}

	profileGroup.GET("/:username", handler.GetPublicProfile)
	profileGroup.POST("/:username/report", handler.ReportProfile)

	// Plural /profiles legacy group for backwards compatibility
	profiles := api.Group("/profiles")
	protectedPlural := profiles.Group("")
	protectedPlural.Use(sharedMiddleware.AuthRequired())
	{
		protectedPlural.GET("/me", handler.GetMyProfile)
		protectedPlural.PUT("/me", handler.UpdateProfile)
		protectedPlural.POST("/me/skills", handler.AddSkill)
		protectedPlural.DELETE("/me/skills/:id", handler.DeleteSkill)
		protectedPlural.POST("/me/certifications", handler.AddCertification)
		protectedPlural.DELETE("/me/certifications/:id", handler.DeleteCertification)
		protectedPlural.POST("/me/projects", handler.AddProject)
		protectedPlural.DELETE("/me/projects/:id", handler.DeleteProject)
		protectedPlural.POST("/me/languages", handler.AddLanguage)
		protectedPlural.DELETE("/me/languages/:id", handler.DeleteLanguage)
		protectedPlural.POST("/me/achievements", handler.AddAchievement)
		protectedPlural.DELETE("/me/achievements/:id", handler.DeleteAchievement)
		protectedPlural.GET("/me/preferences", handler.GetMyPreferences)
		protectedPlural.PUT("/me/preferences", handler.UpdatePreferences)
		protectedPlural.GET("/me/completeness", handler.GetCompleteness)
		protectedPlural.POST("/me/verification", handler.RequestVerification)
		protectedPlural.PUT("/me/career-preferences", handler.UpdateCareerPreferences)
		protectedPlural.GET("/me/resume-consistency", handler.GetResumeConsistency)
		protectedPlural.GET("/me/analytics", handler.GetAnalytics)
	}

	api.GET("/profiles/:userId", handler.GetPublicProfile)

	// Admin Profile Management
	adminUserGroup := api.Group("/admin/users/:id/profile")
	adminUserGroup.Use(sharedMiddleware.AuthRequired())
	{
		adminUserGroup.GET("", handler.AdminGetProfile)
		adminUserGroup.PUT("", handler.AdminUpdateProfile)
		adminUserGroup.POST("/verify", handler.AdminVerifyProfile)
		adminUserGroup.POST("/restrict", handler.AdminRestrictProfile)
	}
}
