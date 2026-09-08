package http

import (
	"net/http"

	"kirmya/internal/ai_job_match/domain"
	"kirmya/internal/ai_job_match/service"
	"kirmya/internal/shared/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type MatchingHandler struct {
	svc service.MatchingService
}

func NewMatchingHandler(svc service.MatchingService) *MatchingHandler {
	return &MatchingHandler{svc: svc}
}

// GetUserMatches handles GET /jobs/matches
func (h *MatchingHandler) GetUserMatches(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	matches, err := h.svc.GetUserMatches(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"data":  matches,
		"count": len(matches),
	})
}

// GetMatchByID handles GET /jobs/matches/:id
func (h *MatchingHandler) GetMatchByID(c *gin.Context) {
	idStr := c.Param("id")
	matchID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID format"})
		return
	}

	match, err := h.svc.GetMatchByID(c.Request.Context(), matchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

// SubmitFeedback handles POST /jobs/matches/:id/feedback
func (h *MatchingHandler) SubmitFeedback(c *gin.Context) {
	idStr := c.Param("id")
	matchID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID format"})
		return
	}

	var payload domain.SubmitFeedbackPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid feedback payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	fb, err := h.svc.SubmitFeedback(c.Request.Context(), userID, matchID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Relevance feedback submitted for ML training dataset",
		"feedback": fb,
	})
}
