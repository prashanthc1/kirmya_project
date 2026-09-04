package http

import (
	"net/http"

	"kirmya/internal/recommendation_engine/domain"
	"kirmya/internal/recommendation_engine/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RecommendationHandler struct {
	svc service.RecommendationService
}

func NewRecommendationHandler(svc service.RecommendationService) *RecommendationHandler {
	return &RecommendationHandler{svc: svc}
}

// GetUnifiedRecommendations handles GET /recommendations/unified
func (h *RecommendationHandler) GetUnifiedRecommendations(c *gin.Context) {
	userID := h.getUserID(c)
	resp, err := h.svc.GetUnifiedRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// TrackEvent handles POST /recommendations/events
func (h *RecommendationHandler) TrackEvent(c *gin.Context) {
	var payload domain.TrackEventPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event payload", "details": err.Error()})
		return
	}

	userID := h.getUserID(c)
	if err := h.svc.TrackEvent(c.Request.Context(), userID, payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recommendation feedback event tracked successfully"})
}

// GetUserPreferences handles GET /recommendations/preferences
func (h *RecommendationHandler) GetUserPreferences(c *gin.Context) {
	userID := h.getUserID(c)
	pref, err := h.svc.GetUserPreferences(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pref)
}

// UpdatePreferences handles POST /recommendations/preferences
func (h *RecommendationHandler) UpdatePreferences(c *gin.Context) {
	var payload domain.UpdatePreferencesPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid preferences payload", "details": err.Error()})
		return
	}

	userID := h.getUserID(c)
	if err := h.svc.UpdatePreferences(c.Request.Context(), userID, payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User feature preferences updated successfully"})
}

func (h *RecommendationHandler) GetCareerGapAnalysis(c *gin.Context) {
	userID := h.getUserID(c)
	analysis, err := h.svc.GetCareerGapAnalysis(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analysis)
}

func (h *RecommendationHandler) AdminGetConfig(c *gin.Context) {
	cfg, err := h.svc.GetActiveConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

func (h *RecommendationHandler) AdminUpdateConfig(c *gin.Context) {
	var cfg domain.RecommendationConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid configuration payload", "details": err.Error()})
		return
	}
	if err := h.svc.UpdateActiveConfig(c.Request.Context(), &cfg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Recommendation algorithm configuration updated successfully"})
}

func (h *RecommendationHandler) AdminGetMetrics(c *gin.Context) {
	metrics, err := h.svc.GetDailyMetrics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, metrics)
}

func (h *RecommendationHandler) getUserID(c *gin.Context) uuid.UUID {
	if val, exists := c.Get("userID"); exists {
		if uid, ok := val.(uuid.UUID); ok {
			return uid
		}
		if strID, ok := val.(string); ok {
			if parsed, err := uuid.Parse(strID); err == nil {
				return parsed
			}
		}
	}
	if val, exists := c.Get("user_id"); exists {
		if uid, ok := val.(uuid.UUID); ok {
			return uid
		}
		if strID, ok := val.(string); ok {
			if parsed, err := uuid.Parse(strID); err == nil {
				return parsed
			}
		}
	}
	return uuid.Nil
}

