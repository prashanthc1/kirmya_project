package http

import (
	"net/http"
	"strconv"

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
	FeedbackType string `json:"feedbackType" binding:"required,oneof=like dislike dismiss save"`
	Comments     string `json:"comments"`
}

type UpdatePrefRequest struct {
	PreferredTitles     []string `json:"preferredTitles" binding:"required"`
	PreferredLocations  []string `json:"preferredLocations" binding:"required"`
	PreferredIndustries []string `json:"preferredIndustries" binding:"required"`
	MinSalary           int      `json:"minSalary" binding:"required"`
	Currency            string   `json:"currency" binding:"required"`
}

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		// Also check user_id if set by alternative middleware
		val, exists = c.Get("user_id")
	}
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	if uid, ok := val.(uuid.UUID); ok {
		return uid, true
	}
	if strID, ok := val.(string); ok {
		if parsed, err := uuid.Parse(strID); err == nil {
			return parsed, true
		}
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context type"})
	return uuid.Nil, false
}

// GetRecommendations handles GET /recommendations
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

// GetFeed handles GET /feed or GET /recommendations/feed
func (h *RecommendationHandler) GetFeed(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	cursor := c.Query("cursor")
	limit := 15
	if limitStr := c.Query("limit"); limitStr != "" {
		if n, err := strconv.Atoi(limitStr); err == nil && n > 0 && n <= 50 {
			limit = n
		}
	}

	feed, err := h.service.GetPersonalizedFeed(c.Request.Context(), userID, cursor, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, feed)
}

// GetPeopleRecommendations handles GET /recommendations/people
func (h *RecommendationHandler) GetPeopleRecommendations(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	limit := 10
	if limitStr := c.Query("limit"); limitStr != "" {
		if n, err := strconv.Atoi(limitStr); err == nil && n > 0 && n <= 30 {
			limit = n
		}
	}

	people, err := h.service.GetRecommendedPeople(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, people)
}

// GetCommunityRecommendations handles GET /recommendations/communities
func (h *RecommendationHandler) GetCommunityRecommendations(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	limit := 10
	if limitStr := c.Query("limit"); limitStr != "" {
		if n, err := strconv.Atoi(limitStr); err == nil && n > 0 && n <= 30 {
			limit = n
		}
	}

	communities, err := h.service.GetRecommendedCommunities(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, communities)
}

// SubmitFeedback handles POST /recommendations/:id/feedback
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

// GetPreferences handles GET /recommendations/preferences
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

// UpdatePreferences handles PUT /recommendations/preferences
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
		PreferredTitles:     req.PreferredTitles,
		PreferredLocations:  req.PreferredLocations,
		PreferredIndustries: req.PreferredIndustries,
		MinSalary:           req.MinSalary,
		Currency:            req.Currency,
	}

	updated, err := h.service.UpdatePreferences(c.Request.Context(), userID, pref)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

