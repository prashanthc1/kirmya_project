package http

import (
	"net/http"
	"kirmya/internal/messaging/models"
	"kirmya/internal/messaging/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type MessagingHandler struct {
	service  *service.MessagingService
	upgrader websocket.Upgrader
}

func NewMessagingHandler(s *service.MessagingService) *MessagingHandler {
	return &MessagingHandler{
		service: s,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

type StartConversationPayload struct {
	ParticipantID string `json:"participantId" binding:"required"`
}

type SendMessagePayload struct {
	Content     string                     `json:"content" binding:"required"`
	Attachments []models.MessageAttachment `json:"attachments,omitempty"`
}

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	userID, ok := val.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid context type"})
		return uuid.Nil, false
	}
	return userID, true
}

func (h *MessagingHandler) UpgradeWS(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	h.service.RegisterClient(userID, conn)
	go h.service.HandleIncomingWS(userID, conn)
}

func (h *MessagingHandler) ListConversations(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	list, err := h.service.ListConversations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *MessagingHandler) GetOrCreateConversation(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload StartConversationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	partID, err := uuid.Parse(payload.ParticipantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid participant ID format"})
		return
	}

	conv, err := h.service.GetOrCreateConversation(c.Request.Context(), userID, partID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conv)
}

func (h *MessagingHandler) ListMessages(c *gin.Context) {
	idStr := c.Param("id")
	convID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID format"})
		return
	}

	posts, err := h.service.GetMessages(c.Request.Context(), convID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func (h *MessagingHandler) SendMessage(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	convID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID format"})
		return
	}

	var payload SendMessagePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.service.SendMessage(c.Request.Context(), userID, convID, payload.Content, payload.Attachments)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, msg)
}
