package http

import (
	"net/http"

	"kirmya/internal/endorsement/domain"
	"kirmya/internal/endorsement/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EndorsementHandler struct {
	svc service.EndorsementService
}

func NewEndorsementHandler(svc service.EndorsementService) *EndorsementHandler {
	return &EndorsementHandler{svc: svc}
}

// EndorseSkill handles POST /endorsements/skills
func (h *EndorsementHandler) EndorseSkill(c *gin.Context) {
	var payload domain.EndorseSkillPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skill endorsement payload", "details": err.Error()})
		return
	}

	endorserIDStr := c.GetString("user_id")
	endorserID, err := uuid.Parse(endorserIDStr)
	if err != nil || endorserID == uuid.Nil {
		endorserID = uuid.New()
	}

	end, err := h.svc.EndorseSkill(c.Request.Context(), endorserID, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Skill endorsed successfully",
		"endorsement": end,
	})
}

// GetUserEndorsements handles GET /endorsements/skills
func (h *EndorsementHandler) GetUserEndorsements(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		userIDStr = c.GetString("user_id")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	groups, err := h.svc.GetUserEndorsements(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  groups,
		"count": len(groups),
	})
}

// SubmitRecommendation handles POST /endorsements/recommendations
func (h *EndorsementHandler) SubmitRecommendation(c *gin.Context) {
	var payload domain.SubmitRecommendationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommendation payload", "details": err.Error()})
		return
	}

	authorIDStr := c.GetString("user_id")
	authorID, err := uuid.Parse(authorIDStr)
	if err != nil || authorID == uuid.Nil {
		authorID = uuid.New()
	}

	rec, err := h.svc.SubmitRecommendation(c.Request.Context(), authorID, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Recommendation submitted for candidate approval",
		"recommendation": rec,
	})
}

// GetRecommendationsForUser handles GET /endorsements/recommendations
func (h *EndorsementHandler) GetRecommendationsForUser(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		userIDStr = c.GetString("user_id")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	recs, err := h.svc.GetRecommendationsForUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  recs,
		"count": len(recs),
	})
}

// UpdateRecommendationStatus handles PUT /endorsements/recommendations/:id/status
func (h *EndorsementHandler) UpdateRecommendationStatus(c *gin.Context) {
	recIDStr := c.Param("id")
	recID, err := uuid.Parse(recIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommendation ID format"})
		return
	}

	var payload domain.UpdateRecommendationStatusPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status update payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	if err := h.svc.UpdateRecommendationStatus(c.Request.Context(), userID, recID, payload.Status, payload.IsFlagged); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recommendation status updated successfully"})
}

// CreateReference handles POST /endorsements/references
func (h *EndorsementHandler) CreateReference(c *gin.Context) {
	var payload domain.CreateReferencePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reference payload", "details": err.Error()})
		return
	}

	candidateIDStr := c.GetString("user_id")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil || candidateID == uuid.Nil {
		candidateID = uuid.New()
	}

	ref, err := h.svc.CreateReference(c.Request.Context(), candidateID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Professional reference created successfully",
		"reference": ref,
	})
}

// GetUserReferences handles GET /endorsements/references
func (h *EndorsementHandler) GetUserReferences(c *gin.Context) {
	candidateIDStr := c.Query("user_id")
	if candidateIDStr == "" {
		candidateIDStr = c.GetString("user_id")
	}
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil || candidateID == uuid.Nil {
		candidateID = uuid.New()
	}

	refs, err := h.svc.GetUserReferences(c.Request.Context(), candidateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  refs,
		"count": len(refs),
	})
}
