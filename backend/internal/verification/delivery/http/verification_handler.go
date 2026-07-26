package http

import (
	"net/http"

	"kirmya/internal/verification/domain"
	"kirmya/internal/verification/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VerificationHandler struct {
	svc service.VerificationService
}

func NewVerificationHandler(svc service.VerificationService) *VerificationHandler {
	return &VerificationHandler{svc: svc}
}

// CreateRequest handles POST /verifications/requests
func (h *VerificationHandler) CreateRequest(c *gin.Context) {
	var payload domain.CreateVerificationRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verification request payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	req, err := h.svc.CreateRequest(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Verification request submitted successfully",
		"request": req,
	})
}

// GetUserRequests handles GET /verifications/requests
func (h *VerificationHandler) GetUserRequests(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	requests, err := h.svc.GetUserRequests(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  requests,
		"count": len(requests),
	})
}

// GetStatus handles GET /verifications/status
func (h *VerificationHandler) GetStatus(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	status, err := h.svc.GetStatus(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, status)
}

// UpdatePrivacy handles PUT /verifications/privacy
func (h *VerificationHandler) UpdatePrivacy(c *gin.Context) {
	var payload domain.UpdatePrivacyPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid privacy update payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	status, err := h.svc.UpdatePrivacy(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Privacy settings updated successfully",
		"status":  status,
	})
}

type AddDocumentPayload struct {
	RequestID   string `json:"request_id" binding:"required"`
	DocumentType string `json:"document_type" binding:"required"`
	FileName     string `json:"file_name" binding:"required"`
	FileURL      string `json:"file_url" binding:"required"`
	IsSensitive  bool   `json:"is_sensitive"`
}

// AddDocument handles POST /verifications/documents
func (h *VerificationHandler) AddDocument(c *gin.Context) {
	var payload AddDocumentPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	reqID, err := uuid.Parse(payload.RequestID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID format"})
		return
	}

	doc, err := h.svc.AddDocument(c.Request.Context(), userID, reqID, payload.DocumentType, payload.FileName, payload.FileURL, payload.IsSensitive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Document uploaded successfully",
		"document": doc,
	})
}
