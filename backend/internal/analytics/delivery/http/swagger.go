package http

import (
	"kirmya/internal/analytics/domain"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the analytics module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerTrackEvent documents POST /api/v1/analytics/events.
//
// @Summary      Track event
// @Description  Records event via the Kirmya analytics module. Requires a valid Bearer access token.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        request  body  domain.TrackEventPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/events [post]
func swaggerTrackEvent() {}

// swaggerGetAdminAnalytics documents GET /api/v1/analytics/admin.
//
// @Summary      Get admin analytics
// @Description  Returns admin analytics via the Kirmya analytics module. Requires a valid Bearer access token.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/admin [get]
func swaggerGetAdminAnalytics() {}

// swaggerGetRecruiterAnalytics documents GET /api/v1/analytics/recruiter.
//
// @Summary      Get recruiter analytics
// @Description  Returns recruiter analytics via the Kirmya analytics module. Requires a valid Bearer access token.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/recruiter [get]
func swaggerGetRecruiterAnalytics() {}

// swaggerGetUserAnalytics documents GET /api/v1/analytics/user.
//
// @Summary      Get user analytics
// @Description  Returns user analytics via the Kirmya analytics module. Requires a valid Bearer access token.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/user [get]
func swaggerGetUserAnalytics() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.TrackEventPayload
	_ swagger.ErrorResponse
)
