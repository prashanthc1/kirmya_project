package http

import (
	"net/http"

	"kirmya/internal/analytics/domain"
	"kirmya/internal/analytics/service"
	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AnalyticsHandler struct {
	svc service.AnalyticsService
}

func NewAnalyticsHandler(svc service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

// TrackEvent handles POST /analytics/events
func (h *AnalyticsHandler) TrackEvent(c *gin.Context) {
	var payload domain.TrackEventPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid analytics payload", "details": err.Error()})
		return
	}

	tenantIDStr := middleware.GetTenantID(c)
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil || tenantID == uuid.Nil {
		tenantID = uuid.MustParse(middleware.DefaultTenantID)
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	if err := h.svc.TrackEvent(c.Request.Context(), tenantID, userID, payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Analytics event tracked successfully"})
}

// GetAdminAnalytics handles GET /analytics/admin
func (h *AnalyticsHandler) GetAdminAnalytics(c *gin.Context) {
	tenantIDStr := middleware.GetTenantID(c)
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil || tenantID == uuid.Nil {
		tenantID = uuid.MustParse(middleware.DefaultTenantID)
	}

	res, err := h.svc.GetAdminAnalytics(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetRecruiterAnalytics handles GET /analytics/recruiter
func (h *AnalyticsHandler) GetRecruiterAnalytics(c *gin.Context) {
	tenantIDStr := middleware.GetTenantID(c)
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil || tenantID == uuid.Nil {
		tenantID = uuid.MustParse(middleware.DefaultTenantID)
	}

	res, err := h.svc.GetRecruiterAnalytics(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetUserAnalytics handles GET /analytics/user
func (h *AnalyticsHandler) GetUserAnalytics(c *gin.Context) {
	tenantIDStr := middleware.GetTenantID(c)
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil || tenantID == uuid.Nil {
		tenantID = uuid.MustParse(middleware.DefaultTenantID)
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	res, err := h.svc.GetUserAnalytics(c.Request.Context(), tenantID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}
