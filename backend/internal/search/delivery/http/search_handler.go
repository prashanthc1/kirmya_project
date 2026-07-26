package http

import (
	"net/http"

	"kirmya/internal/search/domain"
	"kirmya/internal/search/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SearchHandler struct {
	svc service.SearchService
}

func NewSearchHandler(svc service.SearchService) *SearchHandler {
	return &SearchHandler{svc: svc}
}

// Search handles GET /search
func (h *SearchHandler) Search(c *gin.Context) {
	query := c.Query("q")
	category := c.Query("category")

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	resp, err := h.svc.Search(c.Request.Context(), userID, query, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetSuggestions handles GET /search/suggestions
func (h *SearchHandler) GetSuggestions(c *gin.Context) {
	query := c.Query("q")

	suggs, err := h.svc.GetSuggestions(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suggestions": suggs,
		"count":       len(suggs),
	})
}

// GetUserHistory handles GET /search/history
func (h *SearchHandler) GetUserHistory(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	history, err := h.svc.GetUserHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  history,
		"count": len(history),
	})
}

// SavePreference handles POST /search/preferences
func (h *SearchHandler) SavePreference(c *gin.Context) {
	var payload domain.SaveSearchPreferencePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid search preference payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	pref, err := h.svc.SavePreference(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Saved search preference and job alert created successfully",
		"preference": pref,
	})
}
