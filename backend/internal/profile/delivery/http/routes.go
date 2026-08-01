package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ProfileHandler) {
	profiles := api.Group("/profiles")
	protected := profiles.Group("")
	protected.Use(sharedMiddleware.AuthRequired())
	{
		protected.GET("/me", handler.GetMyProfile)
		protected.PUT("/me", handler.UpdateProfile)
		protected.POST("/me/skills", handler.AddSkill)
		protected.DELETE("/me/skills/:id", handler.DeleteSkill)
		protected.POST("/me/certifications", handler.AddCertification)
		protected.DELETE("/me/certifications/:id", handler.DeleteCertification)
		protected.POST("/me/projects", handler.AddProject)
		protected.DELETE("/me/projects/:id", handler.DeleteProject)
		protected.POST("/me/languages", handler.AddLanguage)
		protected.DELETE("/me/languages/:id", handler.DeleteLanguage)
		protected.POST("/me/achievements", handler.AddAchievement)
		protected.DELETE("/me/achievements/:id", handler.DeleteAchievement)
		protected.GET("/me/preferences", handler.GetMyPreferences)
		protected.PUT("/me/preferences", handler.UpdatePreferences)
	}

	api.GET("/profiles/:userId", handler.GetPublicProfile)
}
