package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/job_alerts/models"
)

// This file carries the OpenAPI (swagger) contract for the job alerts module:
// standing alerts, saved searches, the recommendations they feed, and the
// career insights drawn from all three.
//
// The functions below have no runtime role: swaggo reads their annotations to
// build internal/docs. Regenerate the spec with `make swagger` after changing
// anything here.
//
// Every route is scoped to the signed-in candidate. An alert, search or
// recommendation belonging to somebody else is simply not there.

// ---------------------------------------------------------------------------
// Job alerts
// ---------------------------------------------------------------------------

// swaggerGetJobAlerts documents GET /api/v1/job-alerts.
//
// @Summary      List job alerts
// @Description  Returns the standing alerts the signed-in candidate has set up, with their criteria, delivery schedule and whether each is currently active.
// @Tags         Jobs
// @Produce      json
// @Success      200  {array}   models.JobAlert
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-alerts [get]
func swaggerGetJobAlerts() {}

// swaggerCreateJobAlert documents POST /api/v1/job-alerts.
//
// @Summary      Create a job alert
// @Description  Sets up a standing alert. New jobs matching its criteria are delivered on the schedule the alert names.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        request  body      models.JobAlert  true  "The alert to create"
// @Success      201      {object}  models.JobAlert
// @Failure      400      {object}  swagger.ErrorResponse  "Payload failed validation"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-alerts [post]
func swaggerCreateJobAlert() {}

// swaggerUpdateJobAlert documents PUT /api/v1/job-alerts/{id}.
//
// @Summary      Update a job alert
// @Description  Changes an alert's criteria or schedule. The id in the path decides which alert is written, so an id in the body cannot redirect the write to another alert.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id       path      string           true  "Alert id"
// @Param        request  body      models.JobAlert  true  "The revised alert"
// @Success      200      {object}  models.JobAlert
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid alert id or payload"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-alerts/{id} [put]
func swaggerUpdateJobAlert() {}

// swaggerDeleteJobAlert documents DELETE /api/v1/job-alerts/{id}.
//
// @Summary      Delete a job alert
// @Description  Removes the alert and stops its deliveries.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string                   true  "Alert id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid alert id"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-alerts/{id} [delete]
func swaggerDeleteJobAlert() {}

// swaggerPauseJobAlert documents POST /api/v1/job-alerts/{id}/pause.
//
// @Summary      Pause a job alert
// @Description  Stops the alert delivering without deleting it or losing its criteria.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string                   true  "Alert id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"alert paused\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid alert id"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-alerts/{id}/pause [post]
func swaggerPauseJobAlert() {}

// swaggerResumeJobAlert documents POST /api/v1/job-alerts/{id}/resume.
//
// @Summary      Resume a job alert
// @Description  Restarts a paused alert on its existing schedule.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string                   true  "Alert id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"alert resumed\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid alert id"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-alerts/{id}/resume [post]
func swaggerResumeJobAlert() {}

// swaggerGetAlertHistory documents GET /api/v1/job-alerts/history.
//
// @Summary      Alert delivery history
// @Description  What each of the candidate's alerts has delivered and when, so a quiet alert can be told apart from a broken one.
// @Tags         Jobs
// @Produce      json
// @Success      200  {array}   models.AlertDeliveryHistory
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-alerts/history [get]
func swaggerGetAlertHistory() {}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

// swaggerGetJobRecommendations documents GET /api/v1/job-recommendations.
//
// @Summary      List job recommendations
// @Description  Returns the jobs matched to the signed-in candidate's profile and stated preferences, each with the score and the reasons behind it. Recommendations point at real, open postings; none is fabricated.
// @Tags         Jobs
// @Produce      json
// @Success      200  {array}   models.JobRecommendation
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-recommendations [get]
func swaggerGetJobRecommendations() {}

// swaggerGetJobRecommendationByID documents GET /api/v1/job-recommendations/{id}.
//
// @Summary      Get one recommendation
// @Description  Returns a single recommendation with its full match breakdown: which of the candidate's skills and experience the job asks for, and which it asks for that the candidate has not evidenced.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string  true  "Recommendation id"
// @Success      200  {object}  models.JobRecommendation
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid recommendation id"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-recommendations/{id} [get]
func swaggerGetJobRecommendationByID() {}

// swaggerSubmitRecommendationFeedback documents POST /api/v1/job-recommendations/{id}/feedback.
//
// @Summary      Give feedback on a recommendation
// @Description  Records whether a recommendation was useful, which tunes what the candidate is shown next. The feedback is the candidate's own and is not shown to the employer.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id       path      string                                true  "Recommendation id"
// @Param        request  body      models.RecommendationFeedbackRequest  true  "The feedback"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid recommendation id or payload"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/job-recommendations/{id}/feedback [post]
func swaggerSubmitRecommendationFeedback() {}

// ---------------------------------------------------------------------------
// Saved searches
// ---------------------------------------------------------------------------

// swaggerGetSavedSearches documents GET /api/v1/saved-searches.
//
// @Summary      List saved searches
// @Description  Returns the job searches the signed-in candidate has kept, with the filters each holds.
// @Tags         Jobs
// @Produce      json
// @Success      200  {array}   models.SavedSearch
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/saved-searches [get]
func swaggerGetSavedSearches() {}

// swaggerCreateSavedSearch documents POST /api/v1/saved-searches.
//
// @Summary      Save a search
// @Description  Keeps a set of job search filters under a name so it can be re-run, and optionally turned into an alert.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        request  body      models.SavedSearch  true  "The search to save"
// @Success      201      {object}  models.SavedSearch
// @Failure      400      {object}  swagger.ErrorResponse  "Payload failed validation"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/saved-searches [post]
func swaggerCreateSavedSearch() {}

// swaggerUpdateSavedSearch documents PUT /api/v1/saved-searches/{id}.
//
// @Summary      Update a saved search
// @Description  Changes a saved search's name or filters. The id in the path decides which search is written.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id       path      string              true  "Saved search id"
// @Param        request  body      models.SavedSearch  true  "The revised search"
// @Success      200      {object}  models.SavedSearch
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid search id or payload"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/saved-searches/{id} [put]
func swaggerUpdateSavedSearch() {}

// swaggerDeleteSavedSearch documents DELETE /api/v1/saved-searches/{id}.
//
// @Summary      Delete a saved search
// @Description  Removes a saved search. Any alert built from it stops with it.
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string                   true  "Saved search id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"saved search deleted\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid search id"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/saved-searches/{id} [delete]
func swaggerDeleteSavedSearch() {}

// ---------------------------------------------------------------------------
// Career insights
// ---------------------------------------------------------------------------

// swaggerGetCareerInsights documents GET /api/v1/career-insights.
//
// @Summary      Career insights
// @Description  Market context for the signed-in candidate: which of their skills are in demand, how salaries for their roles are moving, and where their searches are concentrated. Figures come from aggregated market data and the candidate's own activity, never from another named person's record.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  models.CareerInsights
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-insights [get]
func swaggerGetCareerInsights() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set, and
// package names such as `models` are not unique across modules, so the imports
// have to be explicit rather than inferred.
var (
	_ models.JobAlert
	_ swagger.ErrorResponse
)
