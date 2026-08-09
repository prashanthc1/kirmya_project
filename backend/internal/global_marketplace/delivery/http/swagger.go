package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the global marketplace module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerSearchInternationalJobs documents GET /api/v1/global/jobs.
//
// @Summary      Search international jobs
// @Description  Searches international jobs via the Kirmya global marketplace module. Public endpoint; no authentication required.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/global/jobs [get]
func swaggerSearchInternationalJobs() {}

// swaggerGetCountries documents GET /api/v1/global/countries.
//
// @Summary      Get countries
// @Description  Returns countries via the Kirmya global marketplace module. Public endpoint; no authentication required.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/global/countries [get]
func swaggerGetCountries() {}

// swaggerGetRegions documents GET /api/v1/global/regions.
//
// @Summary      Get regions
// @Description  Returns regions via the Kirmya global marketplace module. Public endpoint; no authentication required.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/global/regions [get]
func swaggerGetRegions() {}

// swaggerGetCurrencies documents GET /api/v1/global/currencies.
//
// @Summary      Get currencies
// @Description  Returns currencies via the Kirmya global marketplace module. Public endpoint; no authentication required.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/global/currencies [get]
func swaggerGetCurrencies() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
