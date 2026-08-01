package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *InterviewHandler) {
	interviewsGroup := api.Group("/interviews")
	interviewsGroup.Use(sharedMiddleware.AuthRequired())
	{
		interviewsGroup.POST("", handler.ScheduleInterview)
		interviewsGroup.GET("", handler.ListInterviews)
		interviewsGroup.GET("/reminders", handler.GetReminders)
		interviewsGroup.POST("/availability", handler.SetAvailability)
		interviewsGroup.GET("/availability/:candidateId", handler.GetCandidateAvailability)
		interviewsGroup.GET("/:id", handler.GetInterview)
		interviewsGroup.PUT("/:id/status", handler.UpdateInterviewStatus)
		interviewsGroup.POST("/:id/rounds", handler.AddRound)
		interviewsGroup.PUT("/rounds/:roundId/status", handler.UpdateRoundStatus)
		interviewsGroup.POST("/rounds/:roundId/feedback", handler.SubmitFeedback)
		interviewsGroup.GET("/rounds/:roundId/feedback", handler.GetRoundFeedback)
	}
}
