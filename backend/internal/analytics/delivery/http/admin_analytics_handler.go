package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/analytics/service"
)

type AdminAnalyticsHandler struct {
	svc *service.AnalyticsService
}

func NewAdminAnalyticsHandler(svc *service.AnalyticsService) *AdminAnalyticsHandler {
	return &AdminAnalyticsHandler{svc: svc}
}

// GetOverview handles GET /api/v1/admin/analytics/overview
func (h *AdminAnalyticsHandler) GetOverview(c *gin.Context) {
	overview, err := h.svc.GetAdminOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, overview)
}

// RequestExport handles POST /api/v1/admin/analytics/export
func (h *AdminAnalyticsHandler) RequestExport(c *gin.Context) {
	var body struct {
		Format string `json:"format"`
	}
	_ = c.ShouldBindJSON(&body)

	adminID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	exportJob, err := h.svc.RequestExport(c.Request.Context(), adminID, body.Format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Analytics export job queued asynchronously",
		"export":  exportJob,
	})
}
