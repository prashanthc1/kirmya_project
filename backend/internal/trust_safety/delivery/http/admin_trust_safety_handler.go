package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/trust_safety/service"
)

type AdminTrustSafetyHandler struct {
	safetyService service.TrustSafetyService
}

func NewAdminTrustSafetyHandler(safetyService service.TrustSafetyService) *AdminTrustSafetyHandler {
	return &AdminTrustSafetyHandler{safetyService: safetyService}
}

func (h *AdminTrustSafetyHandler) GetAdminCases(c *gin.Context) {
	status := c.Query("status")
	cases, err := h.safetyService.GetAdminCases(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": cases})
}

func (h *AdminTrustSafetyHandler) ApplyAction(c *gin.Context) {
	adminIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	adminID := adminIDVal.(uuid.UUID)

	caseIDStr := c.Param("id")
	caseUUID, err := uuid.Parse(caseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case ID format"})
		return
	}

	var body struct {
		ActionType   string `json:"action_type" binding:"required"`
		Level        string `json:"level" binding:"required"`
		Reason       string `json:"reason" binding:"required"`
		DurationDays int    `json:"duration_days"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	decision, err := h.safetyService.ApplyModerationAction(c.Request.Context(), caseUUID, adminID, body.ActionType, body.Level, body.Reason, body.DurationDays)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": decision})
}

func (h *AdminTrustSafetyHandler) ResolveAppeal(c *gin.Context) {
	adminIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	adminID := adminIDVal.(uuid.UUID)

	appealIDStr := c.Param("id")
	appealUUID, err := uuid.Parse(appealIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appeal ID format"})
		return
	}

	var body struct {
		Status string `json:"status" binding:"required"` // upheld, reversed
		Notes  string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.safetyService.ResolveAppeal(c.Request.Context(), appealUUID, adminID, body.Status, body.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Appeal resolved successfully."})
}

func (h *AdminTrustSafetyHandler) GetAnalytics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"reports_today":         42,
			"open_reports":          12,
			"resolved_reports":      128,
			"avg_review_time_hours": 3.4,
			"fake_job_reports":      8,
			"fraud_reports":         5,
			"suspended_accounts":    2,
			"appeals_total":         6,
			"appeal_success_rate":   0.33,
		},
	})
}
