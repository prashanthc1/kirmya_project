package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *AssessmentHandler) {
	assessmentsGroup := api.Group("/assessments")
	assessmentsGroup.Use(sharedMiddleware.AuthRequired())
	{
		assessmentsGroup.GET("", handler.GetAssessments)
		assessmentsGroup.GET("/results", handler.GetUserResults)
		assessmentsGroup.GET("/badges", handler.GetUserBadges)
		assessmentsGroup.GET("/:id", handler.GetAssessmentByID)
		assessmentsGroup.POST("/:id/submit", handler.SubmitAssessment)
	}
}
