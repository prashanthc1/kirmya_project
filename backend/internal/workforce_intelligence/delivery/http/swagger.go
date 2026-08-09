package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the workforce intelligence module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetMarketInsights documents GET /api/v1/intelligence/market.
//
// @Summary      Get market insights
// @Description  Returns market insights via the Kirmya workforce intelligence module. Public endpoint; no authentication required.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/intelligence/market [get]
func swaggerGetMarketInsights() {}

// swaggerGetSkillTrends documents GET /api/v1/intelligence/skills.
//
// @Summary      Get skill trends
// @Description  Returns skill trends via the Kirmya workforce intelligence module. Public endpoint; no authentication required.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/intelligence/skills [get]
func swaggerGetSkillTrends() {}

// swaggerGetHiringStatistics documents GET /api/v1/intelligence/hiring-stats.
//
// @Summary      Get hiring statistics
// @Description  Returns hiring statistics via the Kirmya workforce intelligence module. Public endpoint; no authentication required.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/intelligence/hiring-stats [get]
func swaggerGetHiringStatistics() {}

// swaggerGetUserCareerRecommendations documents GET /api/v1/intelligence/user-recommendations.
//
// @Summary      Get user career recommendations
// @Description  Returns user career recommendations via the Kirmya workforce intelligence module. Requires a valid Bearer access token.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/intelligence/user-recommendations [get]
func swaggerGetUserCareerRecommendations() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
