package http

import (
	"kirmya/internal/assessment/domain"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the skill assessment module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetAssessments documents GET /api/v1/assessments.
//
// @Summary      Get assessments
// @Description  Returns assessments via the Kirmya skill assessment module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/assessments [get]
func swaggerGetAssessments() {}

// swaggerGetUserResults documents GET /api/v1/assessments/results.
//
// @Summary      Get user results
// @Description  Returns user results via the Kirmya skill assessment module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/assessments/results [get]
func swaggerGetUserResults() {}

// swaggerGetUserBadges documents GET /api/v1/assessments/badges.
//
// @Summary      Get user badges
// @Description  Returns user badges via the Kirmya skill assessment module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/assessments/badges [get]
func swaggerGetUserBadges() {}

// swaggerGetAssessmentByID documents GET /api/v1/assessments/{id}.
//
// @Summary      Get assessment by ID
// @Description  Returns assessment by ID via the Kirmya skill assessment module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/assessments/{id} [get]
func swaggerGetAssessmentByID() {}

// swaggerSubmitAssessment documents POST /api/v1/assessments/{id}/submit.
//
// @Summary      Submit assessment
// @Description  Submits assessment via the Kirmya skill assessment module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.SubmitTestRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/assessments/{id}/submit [post]
func swaggerSubmitAssessment() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.SubmitTestRequest
	_ swagger.ErrorResponse
)
