package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *MentorshipHandler) {
	if handler == nil {
		return
	}
	group := api.Group("/mentorship")
	
	// Public / Search endpoints
	group.GET("/mentors/search", handler.SearchMentors)
	group.GET("/mentors/recommendations", handler.GetRecommendations)
	group.GET("/mentors/:id", handler.GetMentorByID)

	// Authenticated routes
	authed := group.Group("")
	authed.Use(sharedMiddleware.AuthRequired())
	{
		authed.POST("/mentors/profile", handler.CreateOrUpdateProfile)
		authed.GET("/mentors/profile", handler.GetMyProfile)

		authed.POST("/requests", handler.CreateMentorshipRequest)
		authed.GET("/requests", handler.GetUserRequests)
		authed.PUT("/requests/:id/status", handler.RespondToMentorshipRequest)

		authed.GET("/relationships", handler.GetActiveMentorships)
		authed.GET("/relationships/:id", handler.GetMentorshipByID)

		authed.POST("/goals", handler.CreateGoal)
		authed.GET("/goals", handler.GetGoals)
		authed.PUT("/goals/:id", handler.UpdateGoal)

		authed.POST("/sessions", handler.CreateSession)
		authed.GET("/sessions", handler.GetSessions)
		authed.PUT("/sessions/:id", handler.UpdateSession)

		authed.POST("/feedback", handler.SubmitFeedback)
		authed.GET("/feedback", handler.GetFeedback)
	}
}
