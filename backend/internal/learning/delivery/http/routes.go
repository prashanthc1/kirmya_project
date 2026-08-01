package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *LearningHandler) {
	learningGroup := api.Group("/learning")
	learningGroup.Use(sharedMiddleware.AuthRequired())
	{
		learningGroup.GET("/courses", handler.GetCourses)
		learningGroup.GET("/courses/:id", handler.GetCourseByID)
		learningGroup.GET("/paths", handler.GetLearningPaths)
		learningGroup.POST("/enroll", handler.Enroll)
		learningGroup.POST("/progress", handler.UpdateProgress)
		learningGroup.GET("/progress", handler.GetUserProgress)
		learningGroup.GET("/certificates", handler.GetCertificates)
		learningGroup.POST("/assessment", handler.SubmitSkillAssessment)
	}
}
