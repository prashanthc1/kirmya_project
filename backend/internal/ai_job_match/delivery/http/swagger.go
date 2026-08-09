package http

import (
	"kirmya/internal/ai_job_match/domain"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the AI job matching module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetUserMatches documents GET /api/v1/jobs/matches.
//
// @Summary      Get user matches
// @Description  Returns user matches via the Kirmya AI job matching module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/jobs/matches [get]
func swaggerGetUserMatches() {}

// swaggerGetMatchByID documents GET /api/v1/jobs/matches/{id}.
//
// @Summary      Get match by ID
// @Description  Returns match by ID via the Kirmya AI job matching module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/jobs/matches/{id} [get]
func swaggerGetMatchByID() {}

// swaggerSubmitFeedback documents POST /api/v1/jobs/matches/{id}/feedback.
//
// @Summary      Submit feedback
// @Description  Submits feedback via the Kirmya AI job matching module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.SubmitFeedbackPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/jobs/matches/{id}/feedback [post]
func swaggerSubmitFeedback() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.SubmitFeedbackPayload
	_ swagger.ErrorResponse
)
