package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/recruiter/models"
)

// This file carries the OpenAPI (swagger) contract for the recruiter ATS module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetProfile documents GET /api/v1/recruiter/profile.
//
// @Summary      Get profile
// @Description  Returns profile via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/profile [get]
func swaggerGetProfile() {}

// swaggerGetDashboardOverview documents GET /api/v1/recruiter/dashboard.
//
// @Summary      Get dashboard overview
// @Description  Returns dashboard overview via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/dashboard [get]
func swaggerGetDashboardOverview() {}

// swaggerGetJobs documents GET /api/v1/recruiter/jobs.
//
// @Summary      Get jobs
// @Description  Returns jobs via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/jobs [get]
func swaggerGetJobs() {}

// swaggerCreateJob documents POST /api/v1/recruiter/jobs.
//
// @Summary      Create job
// @Description  Creates job via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  models.CreateJobPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/jobs [post]
func swaggerCreateJob() {}

// swaggerSearchCandidates documents GET /api/v1/recruiter/candidates.
//
// @Summary      Search candidates
// @Description  Searches candidates via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates [get]
func swaggerSearchCandidates() {}

// swaggerSearchCandidates2 documents GET /api/v1/recruiter/candidates/search.
//
// @Summary      Search candidates
// @Description  Searches candidates via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/search [get]
func swaggerSearchCandidates2() {}

// swaggerGetFilterFacets documents GET /api/v1/recruiter/candidates/filters.
//
// @Summary      Get filter facets
// @Description  Returns filter facets via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/filters [get]
func swaggerGetFilterFacets() {}

// swaggerGetSavedCandidates documents GET /api/v1/recruiter/candidates/saved.
//
// @Summary      Get saved candidates
// @Description  Returns saved candidates via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/saved [get]
func swaggerGetSavedCandidates() {}

// swaggerGetRecommendations documents GET /api/v1/recruiter/candidates/recommendations.
//
// @Summary      Get recommendations
// @Description  Returns recommendations via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/recommendations [get]
func swaggerGetRecommendations() {}

// swaggerCompareCandidates documents POST /api/v1/recruiter/candidates/compare.
//
// @Summary      Compare candidates
// @Description  Compares candidates via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/compare [post]
func swaggerCompareCandidates() {}

// swaggerGetCandidateDetail documents GET /api/v1/recruiter/candidates/{id}.
//
// @Summary      Get candidate detail
// @Description  Returns candidate detail via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/{id} [get]
func swaggerGetCandidateDetail() {}

// swaggerSaveCandidate documents POST /api/v1/recruiter/candidates/{id}/save.
//
// @Summary      Save candidate
// @Description  Saves candidate via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/{id}/save [post]
func swaggerSaveCandidate() {}

// swaggerUnsaveCandidate documents DELETE /api/v1/recruiter/candidates/{id}/save.
//
// @Summary      Unsave candidate
// @Description  Removes the saved candidate via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/{id}/save [delete]
func swaggerUnsaveCandidate() {}

// swaggerMessageCandidate documents POST /api/v1/recruiter/candidates/{id}/message.
//
// @Summary      Message candidate
// @Description  Messages candidate via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/{id}/message [post]
func swaggerMessageCandidate() {}

// swaggerConnectCandidate documents POST /api/v1/recruiter/candidates/{id}/connect.
//
// @Summary      Connect candidate
// @Description  Connects with candidate via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/candidates/{id}/connect [post]
func swaggerConnectCandidate() {}

// swaggerGetSavedSearches documents GET /api/v1/recruiter/saved-searches.
//
// @Summary      Get saved searches
// @Description  Returns saved searches via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/saved-searches [get]
func swaggerGetSavedSearches() {}

// swaggerCreateSavedSearch documents POST /api/v1/recruiter/saved-searches.
//
// @Summary      Create saved search
// @Description  Creates saved search via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/saved-searches [post]
func swaggerCreateSavedSearch() {}

// swaggerDeleteSavedSearch documents DELETE /api/v1/recruiter/saved-searches/{id}.
//
// @Summary      Delete saved search
// @Description  Deletes saved search via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/saved-searches/{id} [delete]
func swaggerDeleteSavedSearch() {}

// swaggerGetTalentPools documents GET /api/v1/recruiter/talent-pools.
//
// @Summary      Get talent pools
// @Description  Returns talent pools via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/talent-pools [get]
func swaggerGetTalentPools() {}

// swaggerCreateTalentPool documents POST /api/v1/recruiter/talent-pools.
//
// @Summary      Create talent pool
// @Description  Creates talent pool via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/talent-pools [post]
func swaggerCreateTalentPool() {}

// swaggerDeleteTalentPool documents DELETE /api/v1/recruiter/talent-pools/{id}.
//
// @Summary      Delete talent pool
// @Description  Deletes talent pool via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/talent-pools/{id} [delete]
func swaggerDeleteTalentPool() {}

// swaggerAddCandidateToPool documents POST /api/v1/recruiter/talent-pools/{id}/candidates.
//
// @Summary      Add candidate to pool
// @Description  Adds candidate to pool via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/talent-pools/{id}/candidates [post]
func swaggerAddCandidateToPool() {}

// swaggerRemoveCandidateFromPool documents DELETE /api/v1/recruiter/talent-pools/{id}/candidates/{candidateId}.
//
// @Summary      Remove candidate from pool
// @Description  Removes candidate from pool via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        candidateId  path  string  true  "Candidate id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/talent-pools/{id}/candidates/{candidateId} [delete]
func swaggerRemoveCandidateFromPool() {}

// swaggerGetApplications documents GET /api/v1/recruiter/applications.
//
// @Summary      Get applications
// @Description  Returns applications via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/applications [get]
func swaggerGetApplications() {}

// swaggerGetApplicationDetail documents GET /api/v1/recruiter/applications/{id}.
//
// @Summary      Get application detail
// @Description  Returns application detail via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/applications/{id} [get]
func swaggerGetApplicationDetail() {}

// swaggerBulkUpdateApplications documents POST /api/v1/recruiter/applications/bulk.
//
// @Summary      Bulk update applications
// @Description  Bulk-updates update applications via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  models.ATSBulkActionPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/applications/bulk [post]
func swaggerBulkUpdateApplications() {}

// swaggerGetPipeline documents GET /api/v1/recruiter/pipeline/{jobId}.
//
// @Summary      Get pipeline
// @Description  Returns pipeline via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        jobId  path  string  true  "Job id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/pipeline/{jobId} [get]
func swaggerGetPipeline() {}

// swaggerUpdatePipelineStage documents PUT /api/v1/recruiter/pipeline/{id}.
//
// @Summary      Update pipeline stage
// @Description  Updates pipeline stage via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  models.UpdateStagePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/pipeline/{id} [put]
func swaggerUpdatePipelineStage() {}

// swaggerUpdatePipelineStage2 documents PUT /api/v1/recruiter/applications/{id}/stage.
//
// @Summary      Update pipeline stage
// @Description  Updates pipeline stage via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  models.UpdateStagePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/applications/{id}/stage [put]
func swaggerUpdatePipelineStage2() {}

// swaggerGetInterviews documents GET /api/v1/recruiter/interviews.
//
// @Summary      Get interviews
// @Description  Returns interviews via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/interviews [get]
func swaggerGetInterviews() {}

// swaggerScheduleInterview documents POST /api/v1/recruiter/interviews.
//
// @Summary      Schedule interview
// @Description  Schedules interview via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  models.ScheduleInterviewPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/interviews [post]
func swaggerScheduleInterview() {}

// swaggerSubmitInterviewFeedback documents POST /api/v1/recruiter/interviews/{id}/feedback.
//
// @Summary      Submit interview feedback
// @Description  Submits interview feedback via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  models.InterviewFeedbackPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/interviews/{id}/feedback [post]
func swaggerSubmitInterviewFeedback() {}

// swaggerCreateJobOffer documents POST /api/v1/recruiter/offers.
//
// @Summary      Create job offer
// @Description  Creates job offer via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  models.JobOfferPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/offers [post]
func swaggerCreateJobOffer() {}

// swaggerUpdateJobOfferStatus documents PUT /api/v1/recruiter/offers/{id}.
//
// @Summary      Update job offer status
// @Description  Updates job offer status via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/offers/{id} [put]
func swaggerUpdateJobOfferStatus() {}

// swaggerGetAIEvaluation documents GET /api/v1/recruiter/applications/{id}/ai-eval.
//
// @Summary      Get AI evaluation
// @Description  Returns AI evaluation via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/applications/{id}/ai-eval [get]
func swaggerGetAIEvaluation() {}

// swaggerGetAnalytics documents GET /api/v1/recruiter/pipeline/analytics.
//
// @Summary      Get analytics
// @Description  Returns analytics via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/pipeline/analytics [get]
func swaggerGetAnalytics() {}

// swaggerGetAnalytics2 documents GET /api/v1/recruiter/analytics.
//
// @Summary      Get analytics
// @Description  Returns analytics via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/analytics [get]
func swaggerGetAnalytics2() {}

// swaggerSubmitOnboarding documents POST /api/v1/recruiter/onboarding.
//
// @Summary      Submit recruiter onboarding
// @Description  Submits the recruiter onboarding details via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  object  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/onboarding [post]
func swaggerSubmitOnboarding() {}

// swaggerGetJobByID documents GET /api/v1/recruiter/jobs/{id}.
//
// @Summary      Get job
// @Description  Returns one recruiter job via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Job id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/jobs/{id} [get]
func swaggerGetJobByID() {}

// swaggerPublishJob documents POST /api/v1/recruiter/jobs/{id}/publish.
//
// @Summary      Publish job
// @Description  Publishes a recruiter job via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Job id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/jobs/{id}/publish [post]
func swaggerPublishJob() {}

// swaggerPauseJob documents POST /api/v1/recruiter/jobs/{id}/pause.
//
// @Summary      Pause job
// @Description  Pauses a recruiter job via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Job id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/jobs/{id}/pause [post]
func swaggerPauseJob() {}

// swaggerCloseJob documents POST /api/v1/recruiter/jobs/{id}/close.
//
// @Summary      Close job
// @Description  Closes a recruiter job via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Job id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/jobs/{id}/close [post]
func swaggerCloseJob() {}

// swaggerGetJobMatches documents GET /api/v1/recruiter/jobs/{id}/matches.
//
// @Summary      Get job matches
// @Description  Returns the candidates matched to a job via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id     path   string  true   "Job id"
// @Param        page   query  int     false  "Page number (1-based)"  default(1)
// @Param        limit  query  int     false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/jobs/{id}/matches [get]
func swaggerGetJobMatches() {}

// swaggerGetPipelineAll documents GET /api/v1/recruiter/pipeline.
//
// @Summary      Get pipeline
// @Description  Returns the hiring pipeline across jobs via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/pipeline [get]
func swaggerGetPipelineAll() {}

// swaggerGetTeamMembers documents GET /api/v1/recruiter/team.
//
// @Summary      List team members
// @Description  Returns the hiring team members via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/team [get]
func swaggerGetTeamMembers() {}

// swaggerGetMessageTemplates documents GET /api/v1/recruiter/templates.
//
// @Summary      List message templates
// @Description  Returns the recruiter outreach templates via the Kirmya recruiter ATS module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/templates [get]
func swaggerGetMessageTemplates() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ models.JobOfferPayload
	_ swagger.ErrorResponse
)
