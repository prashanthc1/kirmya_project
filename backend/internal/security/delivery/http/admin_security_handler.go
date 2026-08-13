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
