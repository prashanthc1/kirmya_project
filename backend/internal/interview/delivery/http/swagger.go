package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/interview/domain"
)

// This file carries the OpenAPI (swagger) contract for the interview module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerScheduleInterview documents POST /api/v1/interviews.
//
// @Summary      Schedule interview
// @Description  Schedules interview via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateInterviewRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews [post]
func swaggerScheduleInterview() {}

// swaggerListInterviews documents GET /api/v1/interviews.
//
// @Summary      List interviews
// @Description  Returns a list of interviews via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews [get]
func swaggerListInterviews() {}

// swaggerGetReminders documents GET /api/v1/interviews/reminders.
//
// @Summary      Get reminders
// @Description  Returns reminders via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/reminders [get]
func swaggerGetReminders() {}

// swaggerSetAvailability documents POST /api/v1/interviews/availability.
//
// @Summary      Set availability
// @Description  Sets availability via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        request  body  domain.SetAvailabilityRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/availability [post]
func swaggerSetAvailability() {}

// swaggerGetCandidateAvailability documents GET /api/v1/interviews/availability/{candidateId}.
//
// @Summary      Get candidate availability
// @Description  Returns candidate availability via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        candidateId  path  string  true  "Candidate id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/availability/{candidateId} [get]
func swaggerGetCandidateAvailability() {}

// swaggerGetInterview documents GET /api/v1/interviews/{id}.
//
// @Summary      Get interview
// @Description  Returns interview via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/{id} [get]
func swaggerGetInterview() {}

// swaggerUpdateInterviewStatus documents PUT /api/v1/interviews/{id}/status.
//
// @Summary      Update interview status
// @Description  Updates interview status via the Kirmya interview module. Requires a valid Bearer access token.
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
// @Router       /api/v1/interviews/{id}/status [put]
func swaggerUpdateInterviewStatus() {}

// swaggerAddRound documents POST /api/v1/interviews/{id}/rounds.
//
// @Summary      Add round
// @Description  Adds round via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.CreateRoundRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/{id}/rounds [post]
func swaggerAddRound() {}

// swaggerUpdateRoundStatus documents PUT /api/v1/interviews/rounds/{roundId}/status.
//
// @Summary      Update round status
// @Description  Updates round status via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        roundId  path  string  true  "Round id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/rounds/{roundId}/status [put]
func swaggerUpdateRoundStatus() {}

// swaggerSubmitFeedback documents POST /api/v1/interviews/rounds/{roundId}/feedback.
//
// @Summary      Submit feedback
// @Description  Submits feedback via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Accept       json
// @Produce      json
// @Param        roundId  path  string  true  "Round id"
// @Param        request  body  domain.SubmitFeedbackRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/rounds/{roundId}/feedback [post]
func swaggerSubmitFeedback() {}

// swaggerGetRoundFeedback documents GET /api/v1/interviews/rounds/{roundId}/feedback.
//
// @Summary      Get round feedback
// @Description  Returns round feedback via the Kirmya interview module. Requires a valid Bearer access token.
// @Tags         Applications
// @Produce      json
// @Param        roundId  path  string  true  "Round id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/interviews/rounds/{roundId}/feedback [get]
func swaggerGetRoundFeedback() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.SubmitFeedbackRequest
	_ swagger.ErrorResponse
)
