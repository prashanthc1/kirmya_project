package http

import (
	"kirmya/internal/ai/models"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the AI assistant module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetPreferences documents GET /api/v1/ai/preferences.
//
// @Summary      Get preferences
// @Description  Returns preferences via the Kirmya AI assistant module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/ai/preferences [get]
func swaggerGetPreferences() {}

// swaggerUpdatePreferences documents PUT /api/v1/ai/preferences.
//
// @Summary      Update preferences
// @Description  Updates preferences via the Kirmya AI assistant module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/ai/preferences [put]
func swaggerUpdatePreferences() {}

// swaggerAnalyzeResume documents POST /api/v1/ai/resume-analysis.
//
// @Summary      Analyze resume
// @Description  Analyzes resume via the Kirmya AI assistant module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  models.ResumeAnalysisRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/ai/resume-analysis [post]
func swaggerAnalyzeResume() {}

// swaggerAnalyzeSkillGap documents POST /api/v1/ai/skill-gap.
//
// @Summary      Analyze skill gap
// @Description  Analyzes skill gap via the Kirmya AI assistant module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  models.SkillGapRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/ai/skill-gap [post]
func swaggerAnalyzeSkillGap() {}

// swaggerMatchJob documents POST /api/v1/ai/job-matching.
//
// @Summary      Match job
// @Description  Matches job via the Kirmya AI assistant module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  models.JobMatchingRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/ai/job-matching [post]
func swaggerMatchJob() {}

// swaggerPrepareInterview documents POST /api/v1/ai/interview-prep.
//
// @Summary      Prepare interview
// @Description  Prepares interview via the Kirmya AI assistant module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  models.InterviewPrepRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/ai/interview-prep [post]
func swaggerPrepareInterview() {}

// swaggerSuggestCareer documents POST /api/v1/ai/career-suggestions.
//
// @Summary      Suggest career
// @Description  Suggests career via the Kirmya AI assistant module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  models.CareerSuggestionsRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/ai/career-suggestions [post]
func swaggerSuggestCareer() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ models.CareerSuggestionsRequest
	_ swagger.ErrorResponse
)
