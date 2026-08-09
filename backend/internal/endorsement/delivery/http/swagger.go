package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/endorsement/domain"
)

// This file carries the OpenAPI (swagger) contract for the endorsement module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerEndorseSkill documents POST /api/v1/endorsements/skills.
//
// @Summary      Endorse skill
// @Description  Endorses skill via the Kirmya endorsement module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  domain.EndorseSkillPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/endorsements/skills [post]
func swaggerEndorseSkill() {}

// swaggerGetUserEndorsements documents GET /api/v1/endorsements/skills.
//
// @Summary      Get user endorsements
// @Description  Returns user endorsements via the Kirmya endorsement module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/endorsements/skills [get]
func swaggerGetUserEndorsements() {}

// swaggerSubmitRecommendation documents POST /api/v1/endorsements/recommendations.
//
// @Summary      Submit recommendation
// @Description  Submits recommendation via the Kirmya endorsement module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  domain.SubmitRecommendationPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/endorsements/recommendations [post]
func swaggerSubmitRecommendation() {}

// swaggerGetRecommendationsForUser documents GET /api/v1/endorsements/recommendations.
//
// @Summary      Get recommendations for user
// @Description  Returns recommendations for user via the Kirmya endorsement module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/endorsements/recommendations [get]
func swaggerGetRecommendationsForUser() {}

// swaggerUpdateRecommendationStatus documents PUT /api/v1/endorsements/recommendations/{id}/status.
//
// @Summary      Update recommendation status
// @Description  Updates recommendation status via the Kirmya endorsement module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.UpdateRecommendationStatusPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/endorsements/recommendations/{id}/status [put]
func swaggerUpdateRecommendationStatus() {}

// swaggerCreateReference documents POST /api/v1/endorsements/references.
//
// @Summary      Create reference
// @Description  Creates reference via the Kirmya endorsement module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateReferencePayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/endorsements/references [post]
func swaggerCreateReference() {}

// swaggerGetUserReferences documents GET /api/v1/endorsements/references.
//
// @Summary      Get user references
// @Description  Returns user references via the Kirmya endorsement module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/endorsements/references [get]
func swaggerGetUserReferences() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.CreateReferencePayload
	_ swagger.ErrorResponse
)
