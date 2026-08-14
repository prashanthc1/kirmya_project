package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/search/domain"
)

// This file carries the OpenAPI (swagger) contract for the unified search module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerSearch documents GET /api/v1/unified-search.
//
// @Summary      Search
// @Description  Searches via the Kirmya unified search module. Requires a valid Bearer access token.
// @Tags         Search
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/unified-search [get]
func swaggerSearch() {}

// swaggerGetSuggestions documents GET /api/v1/unified-search/suggestions.
//
// @Summary      Get suggestions
// @Description  Returns suggestions via the Kirmya unified search module. Requires a valid Bearer access token.
// @Tags         Search
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/unified-search/suggestions [get]
func swaggerGetSuggestions() {}

// swaggerGetHistory documents GET /api/v1/unified-search/history.
//
// @Summary      Get history
// @Description  Returns history via the Kirmya unified search module. Requires a valid Bearer access token.
// @Tags         Search
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/unified-search/history [get]
func swaggerGetHistory() {}

// swaggerSavePreference documents POST /api/v1/unified-search/preferences.
//
// @Summary      Save preference
// @Description  Saves preference via the Kirmya unified search module. Requires a valid Bearer access token.
// @Tags         Search
// @Accept       json
// @Produce      json
// @Param        request  body  domain.SaveSearchPreferencePayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/unified-search/preferences [post]
func swaggerSavePreference() {}

// swaggerDeleteHistoryItem documents DELETE /api/v1/unified-search/history/{id}.
//
// @Summary      Delete search history item
// @Description  Deletes a specific search history item for the authenticated user.
// @Tags         Search
// @Produce      json
// @Param        id   path  string  true  "Search History item UUID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/unified-search/history/{id} [delete]
func swaggerDeleteHistoryItem() {}

// swaggerClearHistory documents DELETE /api/v1/unified-search/history.
//
// @Summary      Clear all search history
// @Description  Clears all search history entries for the authenticated user.
// @Tags         Search
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/unified-search/history [delete]
func swaggerClearHistory() {}

// swaggerReindex documents POST /api/v1/unified-search/reindex.
//
// @Summary      Reindex entities
// @Description  Triggers a reindexing operation across search engines for specified entities or all entities.
// @Tags         Search
// @Accept       json
// @Produce      json
// @Param        request  body  domain.ReindexPayload  false  "Reindex payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/unified-search/reindex [post]
func swaggerReindex() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.SaveSearchPreferencePayload
	_ domain.ReindexPayload
	_ swagger.ErrorResponse
)

