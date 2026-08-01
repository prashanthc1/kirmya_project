package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *EventHandler) {
	eventsGroup := api.Group("/events")
	eventsGroup.Use(sharedMiddleware.AuthRequired())
	{
		eventsGroup.GET("", handler.GetEvents)
		eventsGroup.POST("", handler.CreateEvent)
		eventsGroup.GET("/my-events", handler.GetUserRegistrations)
		eventsGroup.GET("/:id", handler.GetEventByID)
		eventsGroup.POST("/:id/register", handler.RegisterAttendee)
		eventsGroup.POST("/:id/cancel", handler.CancelRegistration)
	}
}
