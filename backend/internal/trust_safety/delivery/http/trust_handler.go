package http

import (
	"net/http"

	"kirmya/internal/trust_safety/domain"
	"kirmya/internal/trust_safety/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TrustHandler struct {
	svc service.TrustService
}

func NewTrustHandler(svc service.TrustService) *TrustHandler {
	return &TrustHandler{svc: svc}
}

// SubmitReport handles POST /trust/reports
func (h *TrustHandler) SubmitReport(c *gin.Context) {
	var payload domain.SubmitReportPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report payload", "details": err.Error()})
		return
	}

	reporterID := h.getUserID(c)
	rep, err := h.svc.SubmitReport(c.Request.Context(), reporterID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Incident report submitted to Trust & Safety team",
		"report":  rep,
	})
}

// GetReports handles GET /trust/reports
func (h *TrustHandler) GetReports(c *gin.Context) {
	status := c.Query("status")
	reports, err := h.svc.GetReports(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reports, "count": len(reports)})
}

// ExecuteModerationAction handles POST /trust/reports/:id/action
func (h *TrustHandler) ExecuteModerationAction(c *gin.Context) {
	idStr := c.Param("id")
	reportID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID format"})
		return
	}

	var payload domain.ModerationActionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action payload", "details": err.Error()})
		return
	}

	moderatorID := h.getUserID(c)
	action, err := h.svc.ExecuteModerationAction(c.Request.Context(), moderatorID, reportID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Moderation action executed successfully",
		"action":  action,
	})
}

// BlockUser handles POST /trust/users/block
func (h *TrustHandler) BlockUser(c *gin.Context) {
	var body struct {
		BlockedID string `json:"blocked_id" binding:"required"`
		Reason    string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block payload", "details": err.Error()})
		return
	}

	blockedID, err := uuid.Parse(body.BlockedID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blocked user ID format"})
		return
	}

	blockerID := h.getUserID(c)
	if err := h.svc.BlockUser(c.Request.Context(), blockerID, blockedID, body.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User blocked successfully"})
}

// GetFraudLogs handles GET /trust/fraud-logs
func (h *TrustHandler) GetFraudLogs(c *gin.Context) {
	logs, err := h.svc.GetFraudLogs(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs, "count": len(logs)})
}

// GetBadges handles GET /trust/verification
func (h *TrustHandler) GetBadges(c *gin.Context) {
	userID := h.getUserID(c)
	badges, err := h.svc.GetBadges(c.Request.Context(), domain.TargetTypeUser, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": badges, "count": len(badges)})
}

func (h *TrustHandler) getUserID(c *gin.Context) uuid.UUID {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		return uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	}
	return userID
}
