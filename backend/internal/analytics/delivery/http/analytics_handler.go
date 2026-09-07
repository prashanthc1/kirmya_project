package http

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/analytics/models"
	"kirmya/internal/analytics/service"

	sharedMiddleware "kirmya/internal/shared/middleware"
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Event ingested successfully",
		"event":   event,
	})
}

// GetUserAnalytics handles GET /api/v1/analytics/profile
func (h *AnalyticsHandler) GetUserAnalytics(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
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
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// The organization must be named explicitly. Defaulting to a fixed
	// identifier meant an omitted parameter silently returned one particular
	// organization's hiring data to whoever asked.
	orgIDStr := c.Query("organization_id")
	if orgIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil || orgID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization_id"})
		return
	}

	analytics, err := h.svc.GetRecruiterAnalytics(c.Request.Context(), orgID, userID)
	if err != nil {
		if errors.Is(err, service.ErrUnauthorizedOrgAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this organization"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not load recruiter analytics"})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetCompanyAnalytics handles GET /api/v1/company/analytics
func (h *AnalyticsHandler) GetCompanyAnalytics(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	companyIDStr := c.Query("company_id")
	if companyIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id is required"})
		return
	}
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil || companyID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company_id"})
		return
	}

	analytics, err := h.svc.GetCompanyAnalytics(c.Request.Context(), companyID, userID)
	if err != nil {
		if errors.Is(err, service.ErrUnauthorizedOrgAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this company"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not load company analytics"})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetUserConsent handles GET /api/v1/analytics/consent
func (h *AnalyticsHandler) GetUserConsent(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	consent, err := h.svc.GetUserConsent(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, consent)
}

// UpdateUserConsent handles PUT /api/v1/analytics/consent
func (h *AnalyticsHandler) UpdateUserConsent(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req models.UserConsentPreferences
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid consent payload", "details": err.Error()})
		return
	}

	updated, err := h.svc.UpdateUserConsent(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// GetPersonalFunnel handles GET /api/v1/analytics/funnel
func (h *AnalyticsHandler) GetPersonalFunnel(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userIDPtr := &userID

	funnel, err := h.svc.GetUserActivationFunnel(c.Request.Context(), userIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, funnel)
}

// GetPersonalMentorshipAnalytics handles GET /api/v1/analytics/mentorship
func (h *AnalyticsHandler) GetPersonalMentorshipAnalytics(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userIDPtr := &userID

	data, err := h.svc.GetMentorshipAnalytics(c.Request.Context(), userIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

// GetPersonalLearningAnalytics handles GET /api/v1/analytics/learning
func (h *AnalyticsHandler) GetPersonalLearningAnalytics(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userIDPtr := &userID

	data, err := h.svc.GetLearningAnalytics(c.Request.Context(), userIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}
