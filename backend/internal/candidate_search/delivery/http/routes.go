package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *SearchHandler) {
	searchGroup := api.Group("/search")
	searchGroup.Use(sharedMiddleware.AuthRequired())
	{
		searchGroup.POST("/candidates", handler.SearchCandidates)
		searchGroup.GET("/history", handler.GetHistory)
		searchGroup.POST("/saved", handler.SaveCandidate)
		searchGroup.GET("/saved", handler.GetSavedCandidates)
		searchGroup.DELETE("/saved/:id", handler.RemoveSavedCandidate)
		searchGroup.POST("/notes", handler.AddNote)
		searchGroup.GET("/notes/:candidateId", handler.GetNotes)
		searchGroup.POST("/contact", handler.ContactCandidate)
	}
}
