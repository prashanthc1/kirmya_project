package http

import (
	"net/http"

	"kirmya/internal/endorsement/domain"
	"kirmya/internal/endorsement/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
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

	endorserID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
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
	// The subject whose endorsements are being read. An explicit
	// ?user_id= names someone else's public profile; its absence means
	// the caller's own. Either way the caller must be authenticated,
	// and an unparseable subject is rejected rather than replaced with a
	// random identity that quietly returns an empty result.
	caller, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userID := caller
	if requested := c.Query("user_id"); requested != "" {
		parsed, err := uuid.Parse(requested)
		if err != nil || parsed == uuid.Nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
			return
		}
		userID = parsed
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

	authorID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
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
	// The subject whose endorsements are being read. An explicit
	// ?user_id= names someone else's public profile; its absence means
	// the caller's own. Either way the caller must be authenticated,
	// and an unparseable subject is rejected rather than replaced with a
	// random identity that quietly returns an empty result.
	caller, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userID := caller
	if requested := c.Query("user_id"); requested != "" {
		parsed, err := uuid.Parse(requested)
		if err != nil || parsed == uuid.Nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
			return
		}
		userID = parsed
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

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
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

	candidateID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
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
	// The subject whose endorsements are being read. An explicit
	// ?user_id= names someone else's public profile; its absence means
	// the caller's own. Either way the caller must be authenticated,
	// and an unparseable subject is rejected rather than replaced with a
	// random identity that quietly returns an empty result.
	caller, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	candidateID := caller
	if requested := c.Query("user_id"); requested != "" {
		parsed, err := uuid.Parse(requested)
		if err != nil || parsed == uuid.Nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
			return
		}
		candidateID = parsed
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
