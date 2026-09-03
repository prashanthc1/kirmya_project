package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/recommendation_engine/domain"
)

// This file carries the OpenAPI (swagger) contract for the recommendation engine module.

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

// swaggerGetCareerGaps documents GET /api/v1/recommendation-engine/career-gaps.
//
// @Summary      Get career gap analysis
// @Description  Analyzes profile against target job market and returns skill gap recommendations.
// @Tags         AI Matching
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendation-engine/career-gaps [get]
func swaggerGetCareerGaps() {}

// swaggerAdminGetConfig documents GET /api/v1/admin/recommendations/config.
//
// @Summary      Get recommendation engine config (Admin)
// @Description  Returns scoring weights and algorithmic hyper-parameters.
// @Tags         Admin AI
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/recommendations/config [get]
func swaggerAdminGetConfig() {}

// swaggerAdminUpdateConfig documents PUT /api/v1/admin/recommendations/config.
//
// @Summary      Update recommendation engine config (Admin)
// @Description  Updates scoring weights and similarity thresholds.
// @Tags         Admin AI
// @Accept       json
// @Produce      json
// @Param        request  body      object  true  "Config weights"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/recommendations/config [put]
func swaggerAdminUpdateConfig() {}

// swaggerAdminGetMetrics documents GET /api/v1/admin/recommendations/metrics.
//
// @Summary      Get recommendation engine performance metrics (Admin)
// @Description  Returns recommendation CTR, conversion, and NDCG accuracy scores.
// @Tags         Admin AI
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/recommendations/metrics [get]
func swaggerAdminGetMetrics() {}

var (
	_ domain.UpdatePreferencesPayload
	_ swagger.ErrorResponse
)
