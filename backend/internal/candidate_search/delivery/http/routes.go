package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// RegisterRoutes wires the candidate-search module.
//
// Every route here acts as a recruiter: it searches the member directory,
// saves candidates, writes recruiter notes, or contacts a candidate. The group
// sat behind AuthRequired() alone, and the service resolved the caller's
// recruiter profile with GetOrCreateProfile - so, exactly as on /recruiter/*,
// an ordinary account that touched /search/candidates was handed a recruiter
// profile and the member directory with it.
//
// requireRecruiterCapability is the same canonical check the recruiter module
// applies, passed in by the router rather than imported, so this module keeps
// no dependency on the recruiter module's HTTP layer.
func RegisterRoutes(api *gin.RouterGroup, handler *SearchHandler, requireRecruiterCapability gin.HandlerFunc) {
	searchGroup := api.Group("/search")
	searchGroup.Use(sharedMiddleware.AuthRequired())
	searchGroup.Use(requireRecruiterCapability)
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
