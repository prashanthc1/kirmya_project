package http

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// AdminFreelanceHandler is the platform-administrator view of the freelancer
// capability lifecycle.
//
// It exists so that freelancing can be withdrawn from an account without
// suspending the account. Before the lifecycle existed there was no such
// action: an administrator's only lever was users.status, which takes the
// person's feed, network, messages and job applications with it.
type AdminFreelanceHandler struct {
	svc service.FreelanceService
}

func NewAdminFreelanceHandler(svc service.FreelanceService) *AdminFreelanceHandler {
	return &AdminFreelanceHandler{svc: svc}
}

type capabilityDecisionPayload struct {
	// Reason is required. The audit entry is the point of the endpoint: a
	// standing change nobody can explain later is not much better than one
	// nobody recorded.
	Reason string `json:"reason" binding:"required"`
}

// GetFreelancerCapability handles GET /admin/freelancers/:id
func (h *AdminFreelanceHandler) GetFreelancerCapability(c *gin.Context) {
	userID, ok := h.targetUser(c)
	if !ok {
		return
	}
	status, err := h.svc.OnboardingStatus(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not read freelancer capability"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"userId": userID,
		"status": status,
	})
}

// SuspendFreelancer handles POST /admin/freelancers/:id/suspend
func (h *AdminFreelanceHandler) SuspendFreelancer(c *gin.Context) {
	h.decide(c, func(ctx *gin.Context, adminID, userID uuid.UUID, reason string) error {
		return h.svc.SuspendCapability(ctx.Request.Context(), adminID, userID, reason)
	}, "Freelancing suspended for this account. The Kirmya account itself is unchanged.")
}

// ReinstateFreelancer handles POST /admin/freelancers/:id/reinstate
func (h *AdminFreelanceHandler) ReinstateFreelancer(c *gin.Context) {
	h.decide(c, func(ctx *gin.Context, adminID, userID uuid.UUID, reason string) error {
		return h.svc.ReinstateCapability(ctx.Request.Context(), adminID, userID, reason)
	}, "Freelancing reinstated. The existing freelancer profile, portfolio and history are unchanged.")
}

func (h *AdminFreelanceHandler) decide(
	c *gin.Context,
	apply func(*gin.Context, uuid.UUID, uuid.UUID, string) error,
	message string,
) {
	userID, ok := h.targetUser(c)
	if !ok {
		return
	}
	var payload capabilityDecisionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A reason is required.", "details": err.Error()})
		return
	}
	adminID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required", "code": "UNAUTHENTICATED"})
		return
	}

	if err := apply(c, adminID, userID, payload.Reason); err != nil {
		switch {
		case errors.Is(err, service.ErrNotAFreelancer):
			// An administrator may withdraw freelancing from a freelancer. They
			// may not make one, so there is nothing here to act on.
			c.JSON(http.StatusNotFound, gin.H{
				"error": "This account has no freelancer profile.",
				"code":  "FREELANCER_PROFILE_NOT_FOUND",
			})
		case errors.Is(err, service.ErrReasonRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": "A reason is required."})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not change this freelancer capability"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func (h *AdminFreelanceHandler) targetUser(c *gin.Context) (uuid.UUID, bool) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return uuid.Nil, false
	}
	return userID, true
}

// RegisterAdminRoutes mounts the administrative freelancer surface.
//
// RequireAdmin() is the outer gate and stays the outer gate; the named
// permissions are the inner one, per the administrative authorization model.
// freelancers.manage is deliberately not users.suspend: suspending an account
// and suspending its freelancing are different decisions with different blast
// radii, and a role that may do one should not automatically do the other.
func RegisterAdminRoutes(api *gin.RouterGroup, handler *AdminFreelanceHandler, guard *authz.Guard) {
	if handler == nil {
		return
	}
	admin := api.Group("/admin/freelancers")
	admin.Use(sharedMiddleware.RequireAdmin())
	{
		admin.GET("/:id", guard.Require(adminDomain.PermFreelancersRead), handler.GetFreelancerCapability)
		admin.POST("/:id/suspend", guard.Require(adminDomain.PermFreelancersManage), handler.SuspendFreelancer)
		admin.POST("/:id/reinstate", guard.Require(adminDomain.PermFreelancersManage), handler.ReinstateFreelancer)
	}
}
