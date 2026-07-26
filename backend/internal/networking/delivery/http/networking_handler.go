package http

import (
	"net/http"
	"kirmya/internal/networking/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NetworkingHandler struct {
	service *service.NetworkingService
}

func NewNetworkingHandler(s *service.NetworkingService) *NetworkingHandler {
	return &NetworkingHandler{service: s}
}

type SendRequestPayload struct {
	ReceiverID string `json:"receiverId" binding:"required"`
}

type UpdateRequestPayload struct {
	Status string `json:"status" binding:"required,oneof=accepted rejected"`
}

type BlockUserPayload struct {
	BlockedID string `json:"blockedId" binding:"required"`
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

func (h *NetworkingHandler) GetRecommendations(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	recs, err := h.service.GetRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recs)
}

func (h *NetworkingHandler) ListConnections(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	conns, err := h.service.ListConnections(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conns)
}

func (h *NetworkingHandler) ListIncomingRequests(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	reqs, err := h.service.ListIncomingRequests(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reqs)
}

func (h *NetworkingHandler) SendRequest(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload SendRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	receiverID, err := uuid.Parse(payload.ReceiverID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receiver ID format"})
		return
	}

	req, err := h.service.SendConnectionRequest(c.Request.Context(), userID, receiverID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *NetworkingHandler) UpdateRequest(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	requestID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID format"})
		return
	}

	var payload UpdateRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.Status == "accepted" {
		err = h.service.AcceptConnectionRequest(c.Request.Context(), userID, requestID)
	} else {
		err = h.service.RejectConnectionRequest(c.Request.Context(), userID, requestID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request status updated successfully"})
}

func (h *NetworkingHandler) BlockUser(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload BlockUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blockedID, err := uuid.Parse(payload.BlockedID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blocked ID format"})
		return
	}

	err = h.service.BlockUser(c.Request.Context(), userID, blockedID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User blocked successfully"})
}

func (h *NetworkingHandler) UnblockUser(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	blockedIDStr := c.Param("userId")
	blockedID, err := uuid.Parse(blockedIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blocked ID format"})
		return
	}

	err = h.service.UnblockUser(c.Request.Context(), userID, blockedID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User unblocked successfully"})
}
