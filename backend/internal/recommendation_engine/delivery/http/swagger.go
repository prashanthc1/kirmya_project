package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/recommendation_engine/domain"
)

// This file carries the OpenAPI (swagger) contract for the recommendation engine module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetUnifiedRecommendations documents GET /api/v1/recommendation-engine/unified.
//
// @Summary      Get unified recommendations
// @Description  Returns unified recommendations via the Kirmya recommendation engine module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendation-engine/unified [get]
func swaggerGetUnifiedRecommendations() {}

// swaggerTrackEvent documents POST /api/v1/recommendation-engine/events.
//
// @Summary      Track event
// @Description  Records event via the Kirmya recommendation engine module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.TrackEventPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendation-engine/events [post]
func swaggerTrackEvent() {}

// swaggerGetUserPreferences documents GET /api/v1/recommendation-engine/preferences.
//
// @Summary      Get user preferences
// @Description  Returns user preferences via the Kirmya recommendation engine module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendation-engine/preferences [get]
func swaggerGetUserPreferences() {}

// swaggerUpdatePreferences documents POST /api/v1/recommendation-engine/preferences.
//
// @Summary      Update preferences
// @Description  Updates preferences via the Kirmya recommendation engine module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.UpdatePreferencesPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendation-engine/preferences [post]
func swaggerUpdatePreferences() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.UpdatePreferencesPayload
	_ swagger.ErrorResponse
)
