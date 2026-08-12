package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"kirmya/internal/legal/service"
)

type AdminLegalHandler struct {
	legalService service.LegalService
}

func NewAdminLegalHandler(legalService service.LegalService) *AdminLegalHandler {
	return &AdminLegalHandler{legalService: legalService}
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
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": []gin.H{},
	})
}

func (h *AdminLegalHandler) GetRetentionPolicies(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": []gin.H{
			{"data_category": "user_accounts", "retention_days": 365, "action_type": "anonymize"},
			{"data_category": "messages", "retention_days": 180, "action_type": "delete"},
		},
	})
}

func (h *AdminLegalHandler) GetLegalHolds(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": []gin.H{},
	})
}
