package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/trust_safety/models"
	"kirmya/internal/trust_safety/service"
)

type AdminTrustSafetyHandler struct {
	safetyService service.TrustSafetyService
}

func NewAdminTrustSafetyHandler(safetyService service.TrustSafetyService) *AdminTrustSafetyHandler {
	return &AdminTrustSafetyHandler{safetyService: safetyService}
}

func getAdminID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	adminID, ok := val.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid context type"})
		return uuid.Nil, false
	}
	return adminID, true
}

func (h *AdminTrustSafetyHandler) GetAdminSummary(c *gin.Context) {
	summary, err := h.safetyService.GetSafetyMetricsSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *AdminTrustSafetyHandler) GetAdminReports(c *gin.Context) {
	status := c.Query("status")
	reports, err := h.safetyService.GetAdminReports(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reports)
}

func (h *AdminTrustSafetyHandler) GetReportByID(c *gin.Context) {
	reportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	report, err := h.safetyService.GetReportByID(c.Request.Context(), reportID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Report not found"})
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *AdminTrustSafetyHandler) UpdateReportStatus(c *gin.Context) {
	adminID, ok := getAdminID(c)
	if !ok {
		return
	}

	reportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	var body struct {
		Status string `json:"status" binding:"required"`
		Notes  string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.safetyService.UpdateReportStatus(c.Request.Context(), reportID, body.Status, body.Notes, &adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Report status updated successfully."})
}

func (h *AdminTrustSafetyHandler) GetAdminCases(c *gin.Context) {
	status := c.Query("status")
	cases, err := h.safetyService.GetAdminCases(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cases)
}

func (h *AdminTrustSafetyHandler) ClaimCase(c *gin.Context) {
	adminID, ok := getAdminID(c)
	if !ok {
		return
	}

	caseIDStr := c.Param("id")
	var caseUUID uuid.UUID
	var err error

	if caseIDStr != "" {
		caseUUID, err = uuid.Parse(caseIDStr)
	}

	if caseIDStr == "" || err != nil {
		var body models.ClaimCasePayload
		if bindErr := c.ShouldBindJSON(&body); bindErr == nil && body.CaseID != "" {
			caseUUID, err = uuid.Parse(body.CaseID)
		}
	}

	if err != nil || caseUUID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case ID format"})
		return
	}

	err = h.safetyService.ClaimCase(c.Request.Context(), caseUUID, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Case claimed successfully."})
}

func (h *AdminTrustSafetyHandler) AssignCase(c *gin.Context) {
	_, ok := getAdminID(c)
	if !ok {
		return
	}

	caseIDStr := c.Param("id")
	var caseUUID uuid.UUID
	var err error

	var body models.AssignCasePayload
	_ = c.ShouldBindJSON(&body)

	if caseIDStr != "" {
		caseUUID, err = uuid.Parse(caseIDStr)
	}
	if (caseIDStr == "" || err != nil) && body.CaseID != "" {
		caseUUID, err = uuid.Parse(body.CaseID)
	}

	if err != nil || caseUUID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case ID format"})
		return
	}

	var assignAdminUUID uuid.UUID
	if body.AdminID != "" {
		assignAdminUUID, _ = uuid.Parse(body.AdminID)
	}

	err = h.safetyService.AssignCase(c.Request.Context(), caseUUID, assignAdminUUID, body.Team)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Case assigned successfully."})
}

func (h *AdminTrustSafetyHandler) ApplyAction(c *gin.Context) {
	adminID, ok := getAdminID(c)
	if !ok {
		return
	}

	caseIDStr := c.Param("id")
	caseUUID, err := uuid.Parse(caseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case ID format"})
		return
	}

	var body models.ModerationActionPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	decision, err := h.safetyService.ApplyModerationAction(c.Request.Context(), caseUUID, adminID, body.ActionType, body.EnforcementLevel, body.Reason, body.DurationDays)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, decision)
}

func (h *AdminTrustSafetyHandler) GetAdminAppeals(c *gin.Context) {
	status := c.Query("status")
	appeals, err := h.safetyService.GetAdminAppeals(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, appeals)
}

func (h *AdminTrustSafetyHandler) GetAppealByID(c *gin.Context) {
	appealID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appeal ID"})
		return
	}

	appeal, err := h.safetyService.GetAppealByID(c.Request.Context(), appealID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appeal not found"})
		return
	}

	c.JSON(http.StatusOK, appeal)
}

func (h *AdminTrustSafetyHandler) ResolveAppeal(c *gin.Context) {
	adminID, ok := getAdminID(c)
	if !ok {
		return
	}

	appealIDStr := c.Param("id")
	appealUUID, err := uuid.Parse(appealIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appeal ID format"})
		return
	}

	var body struct {
		Status string `json:"status" binding:"required"` // approved, denied, partially_approved
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

	c.JSON(http.StatusOK, gin.H{"message": "Appeal resolved successfully."})
}

func (h *AdminTrustSafetyHandler) GetSafetyRules(c *gin.Context) {
	rules, err := h.safetyService.GetSafetyRules(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rules)
}

func (h *AdminTrustSafetyHandler) UpdateSafetyRule(c *gin.Context) {
	var rule models.SafetyRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.safetyService.UpdateSafetyRule(c.Request.Context(), &rule)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Safety policy rule updated successfully."})
}

func (h *AdminTrustSafetyHandler) GetAnalytics(c *gin.Context) {
	summary, err := h.safetyService.GetSafetyMetricsSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}
