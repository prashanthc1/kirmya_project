package http

import (
	"net/http"

	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
	"kirmya/internal/shared/pagination"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// The payout surface: a freelancer's payout account and the payouts sent to it,
// and the administrator's queue of payouts that could not be sent.

// ListMyPayouts handles GET /freelance/payouts
func (h *EscrowHandler) ListMyPayouts(c *gin.Context) {
	userID, ok := h.caller(c)
	if !ok {
		return
	}
	page := pagination.GetPageParams(c)
	payouts, total, err := h.svc.ListMyPayouts(c.Request.Context(), userID, page.Limit, page.GetOffset())
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, pagination.NewPaginatedResponse(page.Page, page.Limit, total, payouts))
}

// GetPayoutAccount handles GET /freelance/payouts/account
func (h *EscrowHandler) GetPayoutAccount(c *gin.Context) {
	userID, ok := h.caller(c)
	if !ok {
		return
	}
	view, err := h.svc.GetPayoutAccount(c.Request.Context(), userID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, view)
}

// StartPayoutOnboarding handles POST /freelance/payouts/account/onboarding
func (h *EscrowHandler) StartPayoutOnboarding(c *gin.Context) {
	userID, ok := h.caller(c)
	if !ok {
		return
	}
	onboarding, err := h.svc.StartPayoutOnboarding(c.Request.Context(), userID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, onboarding)
}

// RefreshPayoutAccount handles POST /freelance/payouts/account/refresh
func (h *EscrowHandler) RefreshPayoutAccount(c *gin.Context) {
	userID, ok := h.caller(c)
	if !ok {
		return
	}
	view, err := h.svc.RefreshPayoutAccount(c.Request.Context(), userID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, view)
}

// AdminPayoutHandler serves the administrative payout queue.
//
// Reading it is freelance.admin.read; retrying a payout sends money and is
// freelance.admin.write.
type AdminPayoutHandler struct {
	svc service.EscrowService
}

// NewAdminPayoutHandler builds the handler.
func NewAdminPayoutHandler(svc service.EscrowService) *AdminPayoutHandler {
	return &AdminPayoutHandler{svc: svc}
}

// ListPayouts handles GET /admin/freelance/payouts
//
// Oldest first. ?status= narrows it: failed (default), all, or one status.
func (h *AdminPayoutHandler) ListPayouts(c *gin.Context) {
	page := pagination.GetPageParams(c)
	payouts, total, err := h.svc.AdminListPayouts(c.Request.Context(), c.Query("status"), page.Limit, page.GetOffset())
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, pagination.NewPaginatedResponse(page.Page, page.Limit, total, payouts))
}

// RetryPayout handles POST /admin/freelance/payouts/:id/retry
func (h *AdminPayoutHandler) RetryPayout(c *gin.Context) {
	adminID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	payoutID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payout ID format"})
		return
	}
	p, err := h.svc.AdminRetryPayout(c.Request.Context(), adminID, payoutID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, p)
}

// RegisterAdminPayoutRoutes mounts the administrative payout surface.
func RegisterAdminPayoutRoutes(api *gin.RouterGroup, handler *AdminPayoutHandler, guard *authz.Guard) {
	if handler == nil {
		return
	}
	admin := api.Group("/admin/freelance/payouts")
	admin.Use(sharedMiddleware.RequireAdmin())
	{
		admin.GET("", guard.Require(adminDomain.PermFreelanceAdminRead), handler.ListPayouts)
		admin.POST("/:id/retry", guard.Require(adminDomain.PermFreelanceAdminWrite), handler.RetryPayout)
	}
}
