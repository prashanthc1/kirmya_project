package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/resume_analysis/domain"
)

// This file carries the OpenAPI (swagger) contract for the resume analysis module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerAnalyzeResume documents POST /api/v1/resume-analysis/analyze.
//
// @Summary      Analyze resume
// @Description  Analyzes resume via the Kirmya resume analysis module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.AnalyzeResumePayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resume-analysis/analyze [post]
func swaggerAnalyzeResume() {}

// swaggerGetUserAnalysisHistory documents GET /api/v1/resume-analysis/history.
//
// @Summary      Get user analysis history
// @Description  Returns user analysis history via the Kirmya resume analysis module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resume-analysis/history [get]
func swaggerGetUserAnalysisHistory() {}

// swaggerGetAnalysisByID documents GET /api/v1/resume-analysis/{id}.
//
// @Summary      Get analysis by ID
// @Description  Returns analysis by ID via the Kirmya resume analysis module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resume-analysis/{id} [get]
func swaggerGetAnalysisByID() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.AnalyzeResumePayload
	_ swagger.ErrorResponse
)
