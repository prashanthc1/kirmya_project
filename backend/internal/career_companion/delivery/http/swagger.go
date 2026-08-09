package http

import (
	"kirmya/internal/career_companion/domain"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the career companion module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerCreateConversation documents POST /api/v1/career-companion/conversations.
//
// @Summary      Create conversation
// @Description  Creates conversation via the Kirmya career companion module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateConversationPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-companion/conversations [post]
func swaggerCreateConversation() {}

// swaggerSendMessage documents POST /api/v1/career-companion/conversations/{id}/messages.
//
// @Summary      Send message
// @Description  Sends message via the Kirmya career companion module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.SendMessagePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-companion/conversations/{id}/messages [post]
func swaggerSendMessage() {}

// swaggerGetUserConversations documents GET /api/v1/career-companion/conversations.
//
// @Summary      Get user conversations
// @Description  Returns user conversations via the Kirmya career companion module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-companion/conversations [get]
func swaggerGetUserConversations() {}

// swaggerGenerateRoadmap documents POST /api/v1/career-companion/roadmap.
//
// @Summary      Generate roadmap
// @Description  Generates roadmap via the Kirmya career companion module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Accept       json
// @Produce      json
// @Param        request  body  domain.GenerateRoadmapPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-companion/roadmap [post]
func swaggerGenerateRoadmap() {}

// swaggerGetLatestCareerPlan documents GET /api/v1/career-companion/roadmap.
//
// @Summary      Get latest career plan
// @Description  Returns latest career plan via the Kirmya career companion module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-companion/roadmap [get]
func swaggerGetLatestCareerPlan() {}

// swaggerGetUserContext documents GET /api/v1/career-companion/context.
//
// @Summary      Get user context
// @Description  Returns user context via the Kirmya career companion module. Requires a valid Bearer access token.
// @Tags         AI Matching
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/career-companion/context [get]
func swaggerGetUserContext() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.GenerateRoadmapPayload
	_ swagger.ErrorResponse
)
