package http

import (
	"kirmya/internal/career_ai/domain"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the career AI module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGenerateCareerAdvice documents POST /api/v1/career-ai/recommendations.
//
// @Summary      Generate career advice
// @Description  Generates career advice via the Kirmya career AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.GenerateCareerRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-ai/recommendations [post]
func swaggerGenerateCareerAdvice() {}

// swaggerAnalyzeResume documents POST /api/v1/career-ai/resume-feedback.
//
// @Summary      Analyze resume
// @Description  Analyzes resume via the Kirmya career AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.ResumeCritiqueRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-ai/resume-feedback [post]
func swaggerAnalyzeResume() {}

// swaggerIdentifySkillGaps documents POST /api/v1/career-ai/skill-gap.
//
// @Summary      Identify skill gaps
// @Description  Identifies skill gaps via the Kirmya career AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.SkillGapRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-ai/skill-gap [post]
func swaggerIdentifySkillGaps() {}

// swaggerGenerateJobGuidance documents POST /api/v1/career-ai/job-guidance.
//
// @Summary      Generate job guidance
// @Description  Generates job guidance via the Kirmya career AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.JobGuidanceRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-ai/job-guidance [post]
func swaggerGenerateJobGuidance() {}

// swaggerGenerateInterviewPrep documents POST /api/v1/career-ai/interview-prep.
//
// @Summary      Generate interview prep
// @Description  Generates interview prep via the Kirmya career AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.InterviewPrepRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-ai/interview-prep [post]
func swaggerGenerateInterviewPrep() {}

// swaggerGetUserRecommendations documents GET /api/v1/career-ai/recommendations.
//
// @Summary      Get user recommendations
// @Description  Returns user recommendations via the Kirmya career AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-ai/recommendations [get]
func swaggerGetUserRecommendations() {}

// swaggerGetUserUsage documents GET /api/v1/career-ai/usage.
//
// @Summary      Get user usage
// @Description  Returns user usage via the Kirmya career AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-ai/usage [get]
func swaggerGetUserUsage() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.InterviewPrepRequest
	_ swagger.ErrorResponse
)
