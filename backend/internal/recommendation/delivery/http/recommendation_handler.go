package http

import (
	"net/http"
	"kirmya/internal/recommendation/models"
	"kirmya/internal/recommendation/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RecommendationHandler struct {
	service *service.RecommendationService
}

func NewRecommendationHandler(s *service.RecommendationService) *RecommendationHandler {
	return &RecommendationHandler{service: s}
}

type FeedbackRequest struct {
	FeedbackType string `json:"feedbackType" binding:"required,oneof=like dislike dismiss"`
	Comments     string `json:"comments"`
}

type UpdatePrefRequest struct {
	PreferredTitles    []string `json:"preferredTitles" binding:"required"`
	PreferredLocations []string `json:"preferredLocations" binding:"required"`
	PreferredIndustries []string `json:"preferredIndustries" binding:"required"`
	MinSalary          int      `json:"minSalary" binding:"required"`
	Currency           string   `json:"currency" binding:"required"`
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

func (h *RecommendationHandler) GetRecommendations(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	recs, err := h.service.GetRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recs)
}

func (h *RecommendationHandler) SubmitFeedback(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	recIDStr := c.Param("id")
	recID, err := uuid.Parse(recIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommendation ID"})
		return
	}

	var req FeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.SubmitFeedback(c.Request.Context(), userID, recID, req.FeedbackType, req.Comments)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Feedback logged successfully"})
}

func (h *RecommendationHandler) GetPreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	pref, err := h.service.GetOrCreatePreferences(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pref)
}

func (h *RecommendationHandler) UpdatePreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req UpdatePrefRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pref := &models.UserJobPreferences{
		PreferredTitles:    req.PreferredTitles,
		PreferredLocations: req.PreferredLocations,
		PreferredIndustries: req.PreferredIndustries,
		MinSalary:          req.MinSalary,
		Currency:           req.Currency,
	}

	updated, err := h.service.UpdatePreferences(c.Request.Context(), userID, pref)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}
