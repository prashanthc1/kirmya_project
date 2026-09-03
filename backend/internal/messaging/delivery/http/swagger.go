package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/messaging/models"
)

// swaggerUpgradeWS documents GET /api/v1/messages/ws.
//
// @Summary      Upgrade WebSocket
// @Description  Upgrades HTTP connection to WebSocket for real-time chat delivery
// @Tags         Messaging
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messages/ws [get]
func swaggerUpgradeWS() {}

// swaggerListConversations documents GET /api/v1/messages/conversations.
//
// @Summary      List conversations
// @Description  Returns paginated list of chat threads for authenticated user
// @Tags         Messaging
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messages/conversations [get]
func swaggerListConversations() {}

// swaggerGetOrCreateConversation documents POST /api/v1/messages/conversations.
//
// @Summary      Get or create conversation
// @Description  Initiates or opens a 1-on-1 direct message conversation
// @Tags         Messaging
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateConversationDTO  true  "Participant details"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messages/conversations [post]
func swaggerGetOrCreateConversation() {}

// swaggerListMessages documents GET /api/v1/messages/conversations/{id}/messages.
//
// @Summary      List messages in thread
// @Description  Returns chronologically ordered messages in a conversation
// @Tags         Messaging
// @Produce      json
// @Param        id   path      string  true  "Conversation ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messages/conversations/{id}/messages [get]
func swaggerListMessages() {}

// swaggerSendMessage documents POST /api/v1/messages/conversations/{id}/messages.
//
// @Summary      Send direct message
// @Description  Posts a text message with optional file attachments
// @Tags         Messaging
// @Accept       json
// @Produce      json
// @Param        id       path      string                 true  "Conversation ID"
// @Param        request  body      models.SendMessageDTO  true  "Message content"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/messages/conversations/{id}/messages [post]
func swaggerSendMessage() {}

// swaggerArchiveConversation documents POST /api/v1/messages/conversations/{id}/archive.
//
// @Summary      Archive conversation
// @Description  Moves a conversation thread into the user's archive list
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Conversation ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/conversations/{id}/archive [post]
func swaggerArchiveConversation() {}

// swaggerMuteConversation documents POST /api/v1/messages/conversations/{id}/mute.
//
// @Summary      Mute conversation notifications
// @Description  Silences push/email alerts for messages in a conversation
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Conversation ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/conversations/{id}/mute [post]
func swaggerMuteConversation() {}

// swaggerPinConversation documents POST /api/v1/messages/conversations/{id}/pin.
//
// @Summary      Pin conversation to top
// @Description  Pins or unpins a conversation in the active inbox
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Conversation ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/conversations/{id}/pin [post]
func swaggerPinConversation() {}

// swaggerMarkMessagesRead documents POST /api/v1/messages/conversations/{id}/read.
//
// @Summary      Mark conversation as read
// @Description  Updates unread counter and dispatches read receipts
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Conversation ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/conversations/{id}/read [post]
func swaggerMarkMessagesRead() {}

// swaggerAddReaction documents POST /api/v1/messages/messages/{id}/reaction.
//
// @Summary      Add emoji reaction
// @Description  Appends an emoji reaction to an individual message
// @Tags         Messaging
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                      true  "Message ID"
// @Param        request  body      models.AddReactionPayload   true  "Reaction"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/messages/{id}/reaction [post]
func swaggerAddReaction() {}

// swaggerListIncomingRequests documents GET /api/v1/messages/requests.
//
// @Summary      List message requests
// @Description  Returns pending connection-less direct message requests
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/requests [get]
func swaggerListIncomingRequests() {}

// swaggerSendMessageRequest documents POST /api/v1/messages/requests.
//
// @Summary      Send message request
// @Description  Sends outreach message request to non-connected user
// @Tags         Messaging
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateMessageRequestDTO  true  "Request details"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/requests [post]
func swaggerSendMessageRequest() {}

// swaggerAcceptRequest documents POST /api/v1/messages/requests/{id}/accept.
//
// @Summary      Accept message request
// @Description  Accepts incoming message request and creates normal conversation thread
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Request ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/requests/{id}/accept [post]
func swaggerAcceptRequest() {}

// swaggerDeclineRequest documents POST /api/v1/messages/requests/{id}/decline.
//
// @Summary      Decline message request
// @Description  Dismisses or ignores pending message request
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Request ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/requests/{id}/decline [post]
func swaggerDeclineRequest() {}

// swaggerSearchMessages documents GET /api/v1/messages/search.
//
// @Summary      Search message history
// @Description  Full-text search across all user's conversations
// @Tags         Messaging
// @Security     BearerAuth
// @Produce      json
// @Param        q    query     string  true  "Search query"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/search [get]
func swaggerSearchMessages() {}

// swaggerReportMessage documents POST /api/v1/messages/report.
//
// @Summary      Report message / user
// @Description  Submits abuse, harassment or spam report to trust & safety desk
// @Tags         Messaging
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.ReportMessagePayload  true  "Report details"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/messages/report [post]
func swaggerReportMessage() {}

// swaggerAdminMessagingAnalytics documents GET /api/v1/admin/messaging/analytics.
//
// @Summary      Get messaging metrics (Admin)
// @Description  Returns volume of sent messages, active threads and reported abuse count
// @Tags         Admin Messaging
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/messaging/analytics [get]
func swaggerAdminMessagingAnalytics() {}

// swaggerAdminMessagingReports documents GET /api/v1/admin/messaging/reports.
//
// @Summary      Get message reports (Admin)
// @Description  Returns moderation queue of flagged messages
// @Tags         Admin Messaging
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/messaging/reports [get]
func swaggerAdminMessagingReports() {}

var (
	_ swagger.ErrorResponse
	_ models.CreateConversationDTO
	_ models.SendMessageDTO
)
