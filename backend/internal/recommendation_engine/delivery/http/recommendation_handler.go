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

func (h *RecommendationHandler) getUserID(c *gin.Context) uuid.UUID {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		return uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	}
	return userID
}
