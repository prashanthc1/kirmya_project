package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/trust_safety/service"
)

type TrustSafetyHandler struct {
	safetyService service.TrustSafetyService
}

func NewTrustSafetyHandler(safetyService service.TrustSafetyService) *TrustSafetyHandler {
	return &TrustSafetyHandler{safetyService: safetyService}
}

// SubmitReport creates a user report and linked case.
func (h *TrustSafetyHandler) SubmitReport(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var body struct {
		TargetType  string   `json:"target_type" binding:"required"`
		TargetID    string   `json:"target_id" binding:"required"`
		TargetTitle string   `json:"target_title"`
		Category    string   `json:"category" binding:"required"`
		Description string   `json:"description" binding:"required"`
		Evidence    []string `json:"evidence"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetUUID, err := uuid.Parse(body.TargetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target_id format"})
		return
	}

	report, err := h.safetyService.SubmitReport(c.Request.Context(), userID, body.TargetType, targetUUID, body.TargetTitle, body.Category, body.Description, body.Evidence)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": report})
}

// GetUserReports lists reports submitted by current user.
func (h *TrustSafetyHandler) GetUserReports(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	reports, err := h.safetyService.GetUserReports(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": reports})
}

// BlockUser blocks another user, recruiter, or company.
func (h *TrustSafetyHandler) BlockUser(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	blockedIDStr := c.Param("userId")
	blockedUUID, err := uuid.Parse(blockedIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId format"})
		return
	}

	var body struct {
		Reason      string `json:"reason"`
		BlockedType string `json:"blocked_type"`
	}
	_ = c.ShouldBindJSON(&body)
	if body.BlockedType == "" {
		body.BlockedType = "user"
	}

	err = h.safetyService.BlockUser(c.Request.Context(), userID, body.BlockedType, blockedUUID, body.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "User blocked successfully."})
}

// UnblockUser removes a block.
func (h *TrustSafetyHandler) UnblockUser(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	blockedIDStr := c.Param("userId")
	blockedUUID, err := uuid.Parse(blockedIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId format"})
		return
	}

	err = h.safetyService.UnblockUser(c.Request.Context(), userID, blockedUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "User unblocked successfully."})
}

// GetUserBlocks lists blocked entities for current user.
func (h *TrustSafetyHandler) GetUserBlocks(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	blocks, err := h.safetyService.GetUserBlocks(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": blocks})
}

// SubmitAppeal creates an enforcement appeal.
func (h *TrustSafetyHandler) SubmitAppeal(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var body struct {
		DecisionID  string   `json:"decision_id" binding:"required"`
		Reason      string   `json:"reason" binding:"required"`
		Explanation string   `json:"explanation" binding:"required"`
		Evidence    []string `json:"evidence"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	decisionUUID, err := uuid.Parse(body.DecisionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid decision_id format"})
		return
	}

	appeal, err := h.safetyService.SubmitAppeal(c.Request.Context(), decisionUUID, userID, body.Reason, body.Explanation, body.Evidence)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": appeal})
}
