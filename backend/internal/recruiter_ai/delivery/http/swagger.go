package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/recruiter_ai/domain"
)

// This file carries the OpenAPI (swagger) contract for the recruiter AI module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerRankCandidates documents POST /api/v1/recruiter-ai/rank-candidates.
//
// @Summary      Rank candidates
// @Description  Ranks candidates via the Kirmya recruiter AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.RankCandidatesPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter-ai/rank-candidates [post]
func swaggerRankCandidates() {}

// swaggerGenerateInterviewQuestions documents POST /api/v1/recruiter-ai/interview-questions.
//
// @Summary      Generate interview questions
// @Description  Generates interview questions via the Kirmya recruiter AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.GenerateQuestionsPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter-ai/interview-questions [post]
func swaggerGenerateInterviewQuestions() {}

// swaggerOptimizeJobDescription documents POST /api/v1/recruiter-ai/optimize-jd.
//
// @Summary      Optimize job description
// @Description  Optimizes job description via the Kirmya recruiter AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.OptimizeJDPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter-ai/optimize-jd [post]
func swaggerOptimizeJobDescription() {}

// swaggerDraftOutreachEmail documents POST /api/v1/recruiter-ai/outreach-email.
//
// @Summary      Draft outreach email
// @Description  Drafts outreach email via the Kirmya recruiter AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.OutreachEmailPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter-ai/outreach-email [post]
func swaggerDraftOutreachEmail() {}

// swaggerGetRecruiterSessions documents GET /api/v1/recruiter-ai/sessions.
//
// @Summary      Get recruiter sessions
// @Description  Returns recruiter sessions via the Kirmya recruiter AI module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter-ai/sessions [get]
func swaggerGetRecruiterSessions() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.OutreachEmailPayload
	_ swagger.ErrorResponse
)
