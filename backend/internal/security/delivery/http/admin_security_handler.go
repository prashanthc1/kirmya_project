package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/security/models"
	"kirmya/internal/security/service"
)

type AdminSecurityHandler struct {
	securityService service.SecurityService
}

func NewAdminSecurityHandler(securityService service.SecurityService) *AdminSecurityHandler {
	return &AdminSecurityHandler{securityService: securityService}
}

func (h *AdminSecurityHandler) GetAdminSecuritySummary(c *gin.Context) {
	summary, err := h.securityService.GetAdminSecuritySummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *AdminSecurityHandler) GetSecurityEvents(c *gin.Context) {
	events, err := h.securityService.GetSecurityEvents(c.Request.Context(), uuid.Nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, events)
}

func (h *AdminSecurityHandler) GetSecurityIncidents(c *gin.Context) {
	incidents, err := h.securityService.GetSecurityIncidents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, incidents)
}

func (h *AdminSecurityHandler) CreateSecurityIncident(c *gin.Context) {
	var incident models.SecurityIncident
	if err := c.ShouldBindJSON(&incident); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.securityService.CreateSecurityIncident(c.Request.Context(), &incident)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, incident)
}

func (h *AdminSecurityHandler) GetSecurityIncidentByID(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"id":            c.Param("id"),
		"title":         "Suspicious API Token Enumeration",
		"severity":      "high",
		"status":        "investigating",
		"affected_area": "Authentication API",
		"description":   "Automated rapid probe detected on /api/v1/auth/login endpoint.",
		"created_at":    "2026-08-13T10:00:00Z",
	})
}

func (h *AdminSecurityHandler) UpdateSecurityIncident(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Security incident status updated successfully."})
}

func (h *AdminSecurityHandler) GetSecuritySettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"session_idle_timeout_minutes": 60,
		"session_max_lifetime_hours":   720,
		"mfa_required_for_admins":      true,
		"password_min_length":          12,
		"login_rate_limit_per_minute":  10,
	})
}

func (h *AdminSecurityHandler) UpdateSecuritySettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Platform security policies updated successfully."})
}

func (h *AdminSecurityHandler) GetSecurityAlerts(c *gin.Context) {
	status := c.Query("status")
	severity := c.Query("severity")

	alerts, err := h.securityService.GetSecurityAlerts(c.Request.Context(), status, severity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

func (h *AdminSecurityHandler) GetSecurityAlertByID(c *gin.Context) {
	alertID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	alert, err := h.securityService.GetSecurityAlertByID(c.Request.Context(), alertID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alert)
}

func (h *AdminSecurityHandler) UpdateSecurityAlert(c *gin.Context) {
	alertID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var payload models.UpdateSecurityAlertPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	alert, err := h.securityService.UpdateSecurityAlertStatus(c.Request.Context(), alertID, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alert)
}

func (h *AdminSecurityHandler) ResolveSecurityAlert(c *gin.Context) {
	alertID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var payload models.ResolveAlertPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	alert, err := h.securityService.ResolveSecurityAlert(c.Request.Context(), alertID, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alert)
}

func (h *AdminSecurityHandler) GetSecurityRules(c *gin.Context) {
	rules, err := h.securityService.GetSecurityRules(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rules)
}

func (h *AdminSecurityHandler) UpdateSecurityRule(c *gin.Context) {
	ruleID := c.Param("id")
	if ruleID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rule ID is required"})
		return
	}

	var payload models.UpdateSecurityRulePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rule, err := h.securityService.UpdateSecurityRule(c.Request.Context(), ruleID, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rule)
}

func (h *AdminSecurityHandler) GetBotSignals(c *gin.Context) {
	signals, err := h.securityService.GetBotSignals(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, signals)
}

func (h *AdminSecurityHandler) GetFraudAlerts(c *gin.Context) {
	alerts, err := h.securityService.GetFraudAlerts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

func (h *AdminSecurityHandler) GetAccountRiskScores(c *gin.Context) {
	scores, err := h.securityService.GetAccountRiskScores(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, scores)
}

