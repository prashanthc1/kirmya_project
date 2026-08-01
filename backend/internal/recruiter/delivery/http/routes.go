package http

import (
	"github.com/gin-gonic/gin"
	searchHttp "kirmya/internal/search/delivery/http"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *RecruiterHandler, searchHandler *searchHttp.SearchHandler) {
	recruiterGroup := api.Group("/recruiter")
	recruiterGroup.Use(sharedMiddleware.AuthRequired())
	{
		recruiterGroup.GET("/profile", handler.GetProfile)
		recruiterGroup.GET("/dashboard", handler.GetDashboardOverview)
		recruiterGroup.GET("/jobs", handler.GetJobs)
		recruiterGroup.POST("/jobs", handler.CreateJob)

		// Recruiter candidate search integration
		recruiterGroup.GET("/candidates", searchHandler.SearchCandidates)
		recruiterGroup.GET("/candidates/search", searchHandler.SearchCandidates)
		recruiterGroup.GET("/candidates/filters", searchHandler.GetFilterFacets)
		recruiterGroup.GET("/candidates/saved", searchHandler.GetSavedCandidates)
		recruiterGroup.GET("/candidates/recommendations", searchHandler.GetRecommendations)
		recruiterGroup.POST("/candidates/compare", searchHandler.CompareCandidates)
		recruiterGroup.GET("/candidates/:id", searchHandler.GetCandidateDetail)
		recruiterGroup.POST("/candidates/:id/save", searchHandler.SaveCandidate)
		recruiterGroup.DELETE("/candidates/:id/save", searchHandler.UnsaveCandidate)
		recruiterGroup.POST("/candidates/:id/message", searchHandler.MessageCandidate)
		recruiterGroup.POST("/candidates/:id/connect", searchHandler.ConnectCandidate)
		recruiterGroup.GET("/saved-searches", searchHandler.GetSavedSearches)
		recruiterGroup.POST("/saved-searches", searchHandler.CreateSavedSearch)
		recruiterGroup.DELETE("/saved-searches/:id", searchHandler.DeleteSavedSearch)
		recruiterGroup.GET("/talent-pools", searchHandler.GetTalentPools)
		recruiterGroup.POST("/talent-pools", searchHandler.CreateTalentPool)
		recruiterGroup.DELETE("/talent-pools/:id", searchHandler.DeleteTalentPool)
		recruiterGroup.POST("/talent-pools/:id/candidates", searchHandler.AddCandidateToPool)
		recruiterGroup.DELETE("/talent-pools/:id/candidates/:candidateId", searchHandler.RemoveCandidateFromPool)

		// ATS Pipeline & Offers
		recruiterGroup.GET("/applications", handler.GetApplications)
		recruiterGroup.GET("/applications/:id", handler.GetApplicationDetail)
		recruiterGroup.POST("/applications/bulk", handler.BulkUpdateApplications)
		recruiterGroup.GET("/pipeline/:jobId", handler.GetPipeline)
		recruiterGroup.PUT("/pipeline/:id", handler.UpdatePipelineStage)
		recruiterGroup.PUT("/applications/:id/stage", handler.UpdatePipelineStage)
		recruiterGroup.GET("/interviews", handler.GetInterviews)
		recruiterGroup.POST("/interviews", handler.ScheduleInterview)
		recruiterGroup.POST("/interviews/:id/feedback", handler.SubmitInterviewFeedback)
		recruiterGroup.POST("/offers", handler.CreateJobOffer)
		recruiterGroup.PUT("/offers/:id", handler.UpdateJobOfferStatus)
		recruiterGroup.GET("/applications/:id/ai-eval", handler.GetAIEvaluation)
		recruiterGroup.GET("/pipeline/analytics", handler.GetAnalytics)
		recruiterGroup.GET("/analytics", handler.GetAnalytics)
	}
}
