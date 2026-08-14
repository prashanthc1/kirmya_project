package http

import (
	"net/http"

	"kirmya/internal/system_health/models"
	"kirmya/internal/system_health/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SystemHealthHandler struct {
	service *service.SystemHealthService
}

func NewSystemHealthHandler(s *service.SystemHealthService) *SystemHealthHandler {
	return &SystemHealthHandler{service: s}
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

func (h *SystemHealthHandler) GetPublicLiveness(c *gin.Context) {
	c.JSON(http.StatusOK, h.service.GetPublicLiveness())
}

func (h *SystemHealthHandler) GetPublicReadiness(c *gin.Context) {
	resp := h.service.GetPublicReadiness(c.Request.Context())
	if resp.Status == "healthy" {
		c.JSON(http.StatusOK, resp)
	} else {
		c.JSON(http.StatusServiceUnavailable, resp)
	}
}

func (h *SystemHealthHandler) GetPublicStartup(c *gin.Context) {
	resp := h.service.GetPublicStartup(c.Request.Context())
	c.JSON(http.StatusOK, resp)
}

func (h *SystemHealthHandler) GetPublicStatus(c *gin.Context) {
	summary, err := h.service.GetDetailedHealth(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filter public status safely
	publicComponents := make(map[string]string)
	for name, comp := range summary.Components {
		publicComponents[name] = string(comp.Status)
	}

	c.JSON(http.StatusOK, gin.H{
		"overallStatus":   summary.Status,
		"isMaintenance":   summary.IsMaintenance,
		"publicComponents": publicComponents,
		"checkedAt":       summary.CheckedAt,
	})
}

func (h *SystemHealthHandler) GetAdminHealthSummary(c *gin.Context) {
	summary, err := h.service.GetDetailedHealth(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *SystemHealthHandler) ExecuteSelfHealing(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req struct {
		ActionType    string `json:"actionType" binding:"required"`
		ComponentName string `json:"componentName" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	act, err := h.service.ExecuteSelfHealingAction(c.Request.Context(), adminID, req.ActionType, req.ComponentName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, act)
}

func (h *SystemHealthHandler) ToggleMaintenanceMode(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.ToggleMaintenanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mode, err := h.service.ToggleMaintenanceMode(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, mode)
}

func (h *SystemHealthHandler) GenerateDiagnosticReport(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	report, err := h.service.GenerateDiagnosticReport(c.Request.Context(), adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, report)
}

func (h *SystemHealthHandler) ListIncidents(c *gin.Context) {
	list, err := h.service.ListIncidents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *SystemHealthHandler) ListRecoveryActions(c *gin.Context) {
	list, err := h.service.ListRecoveryActions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}
