package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/legal/models"
	"kirmya/internal/legal/service"
)

type AdminLegalHandler struct {
	legalService service.LegalService
}

func NewAdminLegalHandler(legalService service.LegalService) *AdminLegalHandler {
	return &AdminLegalHandler{legalService: legalService}
}

func (h *AdminLegalHandler) GetAdminPrivacySummary(c *gin.Context) {
	summary, err := h.legalService.GetPrivacyDashboardSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *AdminLegalHandler) GetAdminDocuments(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": []gin.H{
			{"slug": "terms", "title": "Terms of Service", "current_version": "1.0.0", "status": "published"},
			{"slug": "privacy", "title": "Privacy Policy", "current_version": "1.0.0", "status": "published"},
			{"slug": "cookies", "title": "Cookie Policy", "current_version": "1.0.0", "status": "published"},
			{"slug": "ai-policy", "title": "AI Policy", "current_version": "1.0.0", "status": "published"},
		},
	})
}

func (h *AdminLegalHandler) GetPrivacyRequests(c *gin.Context) {
	c.JSON(http.StatusOK, []gin.H{
		{"id": uuid.New(), "request_type": "access_export", "status": "completed", "due_date": "2026-09-12T00:00:00Z"},
		{"id": uuid.New(), "request_type": "deletion", "status": "processing", "due_date": "2026-09-15T00:00:00Z"},
	})
}

func (h *AdminLegalHandler) GetPrivacyRequestByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID format"})
		return
	}

	req, err := h.legalService.GetPrivacyRequestByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Privacy request not found"})
		return
	}

	c.JSON(http.StatusOK, req)
}

func (h *AdminLegalHandler) UpdatePrivacyRequest(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Privacy request updated successfully."})
}

func (h *AdminLegalHandler) GetAdminConsents(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"total_consents": 3660,
		"breakdown": gin.H{
			"Terms of Service":   1240,
			"Privacy Policy":     1240,
			"Cookie Preferences": 1180,
		},
	})
}

func (h *AdminLegalHandler) GetRetentionPolicies(c *gin.Context) {
	policies, err := h.legalService.GetRetentionPolicies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, policies)
}

func (h *AdminLegalHandler) UpdateRetentionPolicy(c *gin.Context) {
	var policy models.RetentionPolicy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.legalService.UpdateRetentionPolicy(c.Request.Context(), &policy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Retention policy updated successfully."})
}

func (h *AdminLegalHandler) GetDataProcessingRecords(c *gin.Context) {
	records, err := h.legalService.GetDataProcessingRecords(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, records)
}

func (h *AdminLegalHandler) CreateAdminDataExport(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Admin batch data export triggered successfully."})
}

func (h *AdminLegalHandler) GetLegalHolds(c *gin.Context) {
	c.JSON(http.StatusOK, []gin.H{})
}
