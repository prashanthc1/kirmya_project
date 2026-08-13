package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/analytics/models"
	"kirmya/internal/analytics/service"
)

type AnalyticsHandler struct {
	svc *service.AnalyticsService
}

func NewAnalyticsHandler(svc *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

// IngestEvent handles POST /api/v1/internal/analytics/events
func (h *AnalyticsHandler) IngestEvent(c *gin.Context) {
	var req models.IngestEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	event, err := h.svc.IngestEvent(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Event ingested successfully",
		"event":   event,
	})
}

// GetUserAnalytics handles GET /api/v1/analytics/profile
func (h *AnalyticsHandler) GetUserAnalytics(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		userIDStr = "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d" // Default dev fallback
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		userID = uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	}

	analytics, err := h.svc.GetUserAnalytics(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetRecruiterAnalytics handles GET /api/v1/recruiter/analytics
func (h *AnalyticsHandler) GetRecruiterAnalytics(c *gin.Context) {
	orgIDStr := c.Query("organization_id")
	if orgIDStr == "" {
		orgIDStr = "e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c" // Default dev fallback
	}

	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		orgID = uuid.MustParse("e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c")
	}

	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	analytics, err := h.svc.GetRecruiterAnalytics(c.Request.Context(), orgID, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetCompanyAnalytics handles GET /api/v1/company/analytics
func (h *AnalyticsHandler) GetCompanyAnalytics(c *gin.Context) {
	companyIDStr := c.Query("company_id")
	if companyIDStr == "" {
		companyIDStr = "e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c"
	}

	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		companyID = uuid.MustParse("e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c")
	}

	analytics, err := h.svc.GetCompanyAnalytics(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}
