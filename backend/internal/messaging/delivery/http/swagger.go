package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the messaging module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerUpgradeWS documents GET /api/v1/messaging/ws.
//
// @Summary      Upgrade WS
// @Description  Upgrades WS via the Kirmya messaging module. Requires a valid Bearer access token.
// @Tags         Messaging
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messaging/ws [get]
func swaggerUpgradeWS() {}

// swaggerListConversations documents GET /api/v1/messaging/conversations.
//
// @Summary      List conversations
// @Description  Returns a list of conversations via the Kirmya messaging module. Requires a valid Bearer access token.
// @Tags         Messaging
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messaging/conversations [get]
func swaggerListConversations() {}

// swaggerGetOrCreateConversation documents POST /api/v1/messaging/conversations.
//
// @Summary      Get or create conversation
// @Description  Returns or creates conversation via the Kirmya messaging module. Requires a valid Bearer access token.
// @Tags         Messaging
// @Accept       json
// @Produce      json
// @Param        request  body  StartConversationPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messaging/conversations [post]
func swaggerGetOrCreateConversation() {}

// swaggerListMessages documents GET /api/v1/messaging/conversations/{id}/messages.
//
// @Summary      List messages
// @Description  Returns a list of messages via the Kirmya messaging module. Requires a valid Bearer access token.
// @Tags         Messaging
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messaging/conversations/{id}/messages [get]
func swaggerListMessages() {}

// swaggerSendMessage documents POST /api/v1/messaging/conversations/{id}/messages.
//
// @Summary      Send message
// @Description  Sends message via the Kirmya messaging module. Requires a valid Bearer access token.
// @Tags         Messaging
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  SendMessagePayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messaging/conversations/{id}/messages [post]
func swaggerSendMessage() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
