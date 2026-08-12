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
		// Profile & Onboarding
		recruiterGroup.GET("/profile", handler.GetProfile)
		recruiterGroup.POST("/onboarding", handler.SubmitOnboarding)
		recruiterGroup.GET("/dashboard", handler.GetDashboardOverview)

		// Job Management
		recruiterGroup.GET("/jobs", handler.GetJobs)
		recruiterGroup.POST("/jobs", handler.CreateJob)
		recruiterGroup.GET("/jobs/:id", handler.GetJobByID)
		recruiterGroup.POST("/jobs/:id/publish", handler.PublishJob)
		recruiterGroup.POST("/jobs/:id/pause", handler.PauseJob)
		recruiterGroup.POST("/jobs/:id/close", handler.CloseJob)
		recruiterGroup.GET("/jobs/:id/matches", handler.GetJobMatches)

		// Recruiter Candidate Search & Discovery
		if searchHandler != nil {
			recruiterGroup.GET("/candidates/search", searchHandler.SearchCandidates)
			recruiterGroup.GET("/candidates/filters", searchHandler.GetFilterFacets)
			recruiterGroup.GET("/candidates/saved", searchHandler.GetSavedCandidates)
			recruiterGroup.GET("/candidates/recommendations", searchHandler.GetRecommendations)
		}
		recruiterGroup.GET("/candidates", handler.GetCandidates)
		recruiterGroup.POST("/candidates/:id/save", handler.SaveCandidate)

		// ATS Pipeline & Applications
		recruiterGroup.GET("/applications", handler.GetApplications)
		recruiterGroup.GET("/applications/:id", handler.GetApplicationDetail)
		recruiterGroup.POST("/applications/bulk", handler.BulkUpdateApplications)
		recruiterGroup.GET("/pipeline/:jobId", handler.GetPipeline)
		recruiterGroup.GET("/pipeline", handler.GetPipeline)
		recruiterGroup.PUT("/pipeline/:id", handler.UpdatePipelineStage)
		recruiterGroup.PUT("/applications/:id/stage", handler.UpdatePipelineStage)

		// Interviews & Feedback
		recruiterGroup.GET("/interviews", handler.GetInterviews)
		recruiterGroup.POST("/interviews", handler.ScheduleInterview)
		recruiterGroup.POST("/interviews/:id/feedback", handler.SubmitInterviewFeedback)

		// Offers & AI Evaluation
		recruiterGroup.POST("/offers", handler.CreateJobOffer)
		recruiterGroup.PUT("/offers/:id", handler.UpdateJobOfferStatus)
		recruiterGroup.GET("/applications/:id/ai-eval", handler.GetAIEvaluation)

		// Team, Templates & Analytics
		recruiterGroup.GET("/team", handler.GetTeamMembers)
		recruiterGroup.GET("/templates", handler.GetMessageTemplates)
		recruiterGroup.GET("/pipeline/analytics", handler.GetAnalytics)
		recruiterGroup.GET("/analytics", handler.GetAnalytics)
	}
}
