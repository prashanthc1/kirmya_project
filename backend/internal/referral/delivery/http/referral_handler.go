package http

import (
	"net/http"

	"kirmya/internal/referral/domain"
	"kirmya/internal/referral/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReferralHandler struct {
	svc service.ReferralService
}

func NewReferralHandler(svc service.ReferralService) *ReferralHandler {
	return &ReferralHandler{svc: svc}
}

// CreateRequest handles POST /referrals/requests
func (h *ReferralHandler) CreateRequest(c *gin.Context) {
	var payload domain.CreateReferralRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid referral request payload", "details": err.Error()})
		return
	}

	candidateIDStr := c.GetString("user_id")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil || candidateID == uuid.Nil {
		candidateID = uuid.New()
	}

	req, err := h.svc.CreateRequest(c.Request.Context(), candidateID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Referral request posted to marketplace",
		"request": req,
	})
}

// GetOpenRequests handles GET /referrals/requests
func (h *ReferralHandler) GetOpenRequests(c *gin.Context) {
	requests, err := h.svc.GetOpenRequests(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  requests,
		"count": len(requests),
	})
}

// OfferReferral handles POST /referrals/offer
func (h *ReferralHandler) OfferReferral(c *gin.Context) {
	var payload domain.OfferReferralPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid referral offer payload", "details": err.Error()})
		return
	}

	referrerIDStr := c.GetString("user_id")
	referrerID, err := uuid.Parse(referrerIDStr)
	if err != nil || referrerID == uuid.Nil {
		referrerID = uuid.New()
	}

	ref, err := h.svc.OfferReferral(c.Request.Context(), referrerID, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Referral offer initiated successfully",
		"referral": ref,
	})
}

// GetUserReferrals handles GET /referrals/my-referrals
func (h *ReferralHandler) GetUserReferrals(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	referrals, err := h.svc.GetUserReferrals(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  referrals,
		"count": len(referrals),
	})
}

// UpdateReferralStatus handles PUT /referrals/:id/status
func (h *ReferralHandler) UpdateReferralStatus(c *gin.Context) {
	refIDStr := c.Param("id")
	refID, err := uuid.Parse(refIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid referral ID format"})
		return
	}

	var payload domain.UpdateReferralStatusPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status update payload", "details": err.Error()})
		return
	}

	actorIDStr := c.GetString("user_id")
	actorID, err := uuid.Parse(actorIDStr)
	if err != nil || actorID == uuid.Nil {
		actorID = uuid.New()
	}

	ref, err := h.svc.UpdateReferralStatus(c.Request.Context(), actorID, refID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Referral status updated successfully",
		"referral": ref,
	})
}
