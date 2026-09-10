package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/recruiter/service"
	searchHttp "kirmya/internal/search/delivery/http"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// RegisterRoutes wires the recruiter module in two tiers.
//
// The whole group used to sit behind AuthRequired() alone, which meant being
// signed in was the only thing standing between any account and a live public
// job posting: the handlers provisioned a recruiter profile on first touch.
//
//	onboardingGroup   authenticated, no capability yet - how an account becomes
//	                  a recruiter in the first place
//	capabilityGroup   authenticated AND holding an active standalone Recruiting
//	                  capability - everything privileged
//
// The split is at the router rather than in each handler so that a route added
// to the wrong group is visible here, in one place, rather than silently
// unprotected in a file nobody re-reads.
func RegisterRoutes(api *gin.RouterGroup, handler *RecruiterHandler, searchHandler *searchHttp.SearchHandler, svc *service.RecruiterService) {
	recruiterGroup := api.Group("/recruiter")
	recruiterGroup.Use(sharedMiddleware.AuthRequired())

	// Tier 1: reachable by any authenticated account. These are the routes an
	// ordinary professional needs in order to *become* a recruiter, plus the
	// read that tells the client which state it is in. None of them grants
	// anything by being called; SubmitOnboarding is the one transition.
	onboardingGroup := recruiterGroup.Group("")
	{
		onboardingGroup.GET("/profile", handler.GetProfile)
		onboardingGroup.POST("/onboarding", handler.SubmitOnboarding)
	}

	// Tier 2: everything that acts as a recruiter.
	recruiterGroup.Use(RequireRecruiterCapability(svc))
	{
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
		recruiterGroup.GET("/candidates/search", searchHandler.SearchCandidates)
		recruiterGroup.GET("/candidates/filters", searchHandler.GetFilterFacets)
		recruiterGroup.GET("/candidates/saved", searchHandler.GetSavedCandidates)
		recruiterGroup.GET("/candidates/recommendations", searchHandler.GetRecommendations)
		recruiterGroup.POST("/candidates/compare", searchHandler.CompareCandidates)
		recruiterGroup.GET("/candidates/:id", handler.GetCandidateDetail)
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
		recruiterGroup.PUT("/interviews/:id/cancel", handler.CancelInterview)
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

		// Candidate Notes & Evaluations
		recruiterGroup.POST("/candidates/:id/notes", handler.CreateCandidateNote)
		recruiterGroup.GET("/candidates/:id/notes", handler.GetCandidateNotes)
		recruiterGroup.POST("/applications/:id/evaluate", handler.CreateCandidateEvaluation)
		recruiterGroup.GET("/applications/:id/evaluations", handler.GetCandidateEvaluations)
		recruiterGroup.GET("/applications/:id/history", handler.GetStageHistory)
	}
}
