package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the recommendation module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetRecommendations documents GET /api/v1/recommendations.
//
// @Summary      Get recommendations
// @Description  Returns recommendations via the Kirmya recommendation module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendations [get]
func swaggerGetRecommendations() {}

// swaggerSubmitFeedback documents POST /api/v1/recommendations/{id}/feedback.
//
// @Summary      Submit feedback
// @Description  Submits feedback via the Kirmya recommendation module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  FeedbackRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendations/{id}/feedback [post]
func swaggerSubmitFeedback() {}

// swaggerGetPreferences documents GET /api/v1/recommendations/preferences.
//
// @Summary      Get preferences
// @Description  Returns preferences via the Kirmya recommendation module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendations/preferences [get]
func swaggerGetPreferences() {}

// swaggerUpdatePreferences documents PUT /api/v1/recommendations/preferences.
//
// @Summary      Update preferences
// @Description  Updates preferences via the Kirmya recommendation module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  UpdatePrefRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendations/preferences [put]
func swaggerUpdatePreferences() {}

// swaggerGetFeed documents GET /api/v1/feed.
//
// @Summary      Get personalized home feed
// @Description  Returns a personalized, interleaved stream of jobs, suggested peers, and community discovery for the authenticated user.
// @Tags         Recommendations
// @Produce      json
// @Param        cursor query string false "Pagination cursor"
// @Param        limit  query int    false "Items count" default(15)
// @Success      200    {object} swagger.PaginationResponse
// @Failure      401    {object} swagger.ErrorResponse
// @Failure      500    {object} swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/feed [get]
func swaggerGetFeed() {}

// swaggerGetRecommendationsFeed documents GET /api/v1/recommendations/feed.
//
// @Summary      Get personalized recommendations feed
// @Description  Returns a personalized stream of jobs, suggested peers, and communities.
// @Tags         Recommendations
// @Produce      json
// @Param        cursor query string false "Pagination cursor"
// @Param        limit  query int    false "Items count" default(15)
// @Success      200    {object} swagger.PaginationResponse
// @Failure      401    {object} swagger.ErrorResponse
// @Failure      500    {object} swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendations/feed [get]
func swaggerGetRecommendationsFeed() {}

// swaggerGetPeopleRecommendations documents GET /api/v1/recommendations/people.
//
// @Summary      Get recommended professionals
// @Description  Returns suggested professionals and peers grounded in real user profiles.
// @Tags         Recommendations
// @Produce      json
// @Param        limit query int false "Items count" default(10)
// @Success      200   {object} swagger.PaginationResponse
// @Failure      401   {object} swagger.ErrorResponse
// @Failure      500   {object} swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendations/people [get]
func swaggerGetPeopleRecommendations() {}

// swaggerGetCommunityRecommendations documents GET /api/v1/recommendations/communities.
//
// @Summary      Get recommended communities
// @Description  Returns recommended peer discussion groups and professional communities.
// @Tags         Recommendations
// @Produce      json
// @Param        limit query int false "Items count" default(10)
// @Success      200   {object} swagger.PaginationResponse
// @Failure      401   {object} swagger.ErrorResponse
// @Failure      500   {object} swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recommendations/communities [get]
func swaggerGetCommunityRecommendations() {}


// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
