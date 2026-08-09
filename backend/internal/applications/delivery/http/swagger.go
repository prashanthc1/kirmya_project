package http

import (
	"kirmya/internal/applications/models"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the candidate
// applications module: the applications a person has sent, the jobs they have
// saved, and the documents they attach to both.
//
// The functions below have no runtime role: swaggo reads their annotations to
// build internal/docs. Regenerate the spec with `make swagger` after changing
// anything here.
//
// Every route in this module is scoped to the signed-in candidate. An id
// belonging to somebody else is not found rather than forbidden, so one
// candidate cannot enumerate another's applications by trying ids.

// swaggerGetApplications documents GET /api/v1/applications.
//
// @Summary      List the caller's applications
// @Description  Returns the applications the signed-in candidate has submitted, most recent first, optionally narrowed by status or a free-text search over the job title and company.
// @Tags         Jobs
// @Produce      json
// @Param        status  query     string  false  "Filter by application status"
// @Param        search  query     string  false  "Free-text search over job title and company"
// @Success      200     {array}   models.ApplicationSummary
// @Failure      401     {object}  swagger.ErrorResponse
// @Failure      500     {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/applications [get]
func swaggerGetApplications() {}

// swaggerGetApplicationByID documents GET /api/v1/applications/{id}.
//
// @Summary      Get one application
// @Description  Returns a single application in full, including its stage, any offer attached to it and the notes the candidate has kept against it. Only the candidate who made the application can read it.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string  true  "Application id"
// @Success      200  {object}  models.ApplicationDetail
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid application ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse  "No such application for this candidate"
// @Security     BearerAuth
// @Router       /api/v1/applications/{id} [get]
func swaggerGetApplicationByID() {}

// swaggerWithdrawApplication documents PUT /api/v1/applications/{id}/withdraw.
//
// @Summary      Withdraw an application
// @Description  Withdraws the candidate's application. The record is kept and marked withdrawn rather than deleted, so the employer's audit trail stays intact.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string                   true  "Application id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"Application withdrawn successfully\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid application ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/applications/{id}/withdraw [put]
func swaggerWithdrawApplication() {}

// swaggerGetApplicationTimeline documents GET /api/v1/applications/{id}/timeline.
//
// @Summary      Application timeline
// @Description  The dated sequence of what has happened to an application — submitted, viewed, moved between stages, interviewed, decided.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string  true  "Application id"
// @Success      200  {array}   models.ApplicationTimelineItem
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid application ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/applications/{id}/timeline [get]
func swaggerGetApplicationTimeline() {}

// swaggerGetApplicationAnalytics documents GET /api/v1/applications/analytics.
//
// @Summary      Application statistics
// @Description  The candidate's own figures: how many applications are in each stage, how they have moved month by month, and where the funnel narrows. Covers this candidate only.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  ApplicationAnalyticsResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/applications/analytics [get]
func swaggerGetApplicationAnalytics() {}

// swaggerGetApplicationAIInsights documents GET /api/v1/applications/ai-insights.
//
// @Summary      AI insights on the caller's applications
// @Description  Observations drawn from the candidate's own application history — which stages they stall at, which roles convert, what to try next. Everything reported is derived from the candidate's real records; no application, employer or outcome is invented.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  models.AIApplicationInsightsDTO
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/applications/ai-insights [get]
func swaggerGetApplicationAIInsights() {}

// ---------------------------------------------------------------------------
// Saved jobs
// ---------------------------------------------------------------------------

// swaggerGetSavedJobs documents GET /api/v1/jobs/saved.
//
// @Summary      List saved jobs
// @Description  Returns the jobs the signed-in candidate has saved, grouped into their collections.
// @Tags         Jobs
// @Produce      json
// @Success      200  {array}   models.SavedJobDTO
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/jobs/saved [get]
func swaggerGetSavedJobs() {}

// swaggerSaveJob documents POST /api/v1/jobs/{id}/save.
//
// @Summary      Save a job
// @Description  Saves a job to the candidate's list, with an optional private note. Saving a job twice is not an error, and saving is not applying.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id       path      string                   true   "Job id"
// @Param        request  body      SaveJobBody              false  "Optional private note"
// @Success      200      {object}  swagger.SuccessResponse  "{\"message\": \"Job saved successfully\"}"
// @Failure      400      {object}  swagger.ErrorResponse    "Invalid job ID"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/jobs/{id}/save [post]
func swaggerSaveJob() {}

// swaggerRemoveSavedJob documents DELETE /api/v1/jobs/{id}/save.
//
// @Summary      Remove a saved job
// @Description  Takes a job off the candidate's saved list. Any application already sent for that job is untouched.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string                   true  "Job id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"Saved job removed successfully\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid job ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/jobs/{id}/save [delete]
func swaggerRemoveSavedJob() {}

// ---------------------------------------------------------------------------
// Candidate documents
// ---------------------------------------------------------------------------

// swaggerGetCandidateDocuments documents GET /api/v1/documents.
//
// @Summary      List the caller's documents
// @Description  Returns the résumés, cover letters and certificates the candidate has stored for attaching to applications. The list is the candidate's own; nobody else's documents are ever returned here.
// @Tags         Profiles
// @Produce      json
// @Success      200  {array}   models.CandidateDocument
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/documents [get]
func swaggerGetCandidateDocuments() {}

// swaggerUploadDocument documents POST /api/v1/documents/upload.
//
// @Summary      Register an uploaded document
// @Description  Records a document against the candidate's profile by reference. The file itself is uploaded to storage separately and named here by URL; the reference is private to the candidate and to the employers they attach it to.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body      UploadDocumentBody  true  "Document to register"
// @Success      201      {object}  models.CandidateDocument
// @Failure      400      {object}  swagger.ErrorResponse  "Payload failed validation"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/documents/upload [post]
func swaggerUploadDocument() {}

// swaggerDeleteDocument documents DELETE /api/v1/documents/{id}.
//
// @Summary      Delete a document
// @Description  Removes a document from the candidate's profile. Only the candidate who owns it can delete it.
// @Tags         Profiles
// @Produce      json
// @Param        id   path      string                   true  "Document id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"Document deleted successfully\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid document ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/documents/{id} [delete]
func swaggerDeleteDocument() {}

// ---------------------------------------------------------------------------
// Request and response shapes the handlers declare inline.
// ---------------------------------------------------------------------------

// SaveJobBody is the body of POST /api/v1/jobs/{id}/save.
type SaveJobBody struct {
	// Notes is the candidate's private reminder about the job. It is never
	// shown to the employer.
	Notes string `json:"notes" example:"Ask about the remote policy"`
}

// UploadDocumentBody is the body of POST /api/v1/documents/upload.
type UploadDocumentBody struct {
	Title        string `json:"title" example:"Senior Backend Engineer CV"`
	DocumentType string `json:"document_type" example:"resume"`
	// FileURL points at the object already placed in storage.
	FileURL string `json:"file_url" example:"https://files.kirmya.com/candidates/cv.pdf"`
	// IsDefault attaches this document to applications unless another is chosen.
	IsDefault bool `json:"is_default" example:"true"`
}

// ApplicationAnalyticsResponse is the reply to GET /api/v1/applications/analytics:
// the stage counts alongside the longer career view they are drawn from.
type ApplicationAnalyticsResponse struct {
	Stats     models.ApplicationStatsDTO `json:"stats"`
	Analytics models.CareerAnalyticsDTO  `json:"analytics"`
}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set, and
// package names such as `models` are not unique across modules, so the imports
// have to be explicit rather than inferred.
var (
	_ models.ApplicationSummary
	_ swagger.ErrorResponse
)
