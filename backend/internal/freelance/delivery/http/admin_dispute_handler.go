package http

import (
	"net/http"

	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
	"kirmya/internal/shared/pagination"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminDisputeHandler serves the administrative dispute queue and decisions.
//
// Behind the platform's existing admin guard with the freelance pair of
// permissions, like the marketplace surface next to it: reading the queue is
// freelance.admin.read, deciding a dispute moves money and is
// freelance.admin.write.
type AdminDisputeHandler struct {
	svc service.EscrowService
}

// NewAdminDisputeHandler builds the handler.
func NewAdminDisputeHandler(svc service.EscrowService) *AdminDisputeHandler {
	return &AdminDisputeHandler{svc: svc}
}

// ListDisputes handles GET /admin/freelance/disputes
//
// Oldest first, because the oldest dispute has been waiting longest. ?status=
// narrows it: open (default), all, or a single status.
func (h *AdminDisputeHandler) ListDisputes(c *gin.Context) {
	page := pagination.GetPageParams(c)
	disputes, total, err := h.svc.AdminListDisputes(c.Request.Context(), c.Query("status"), page.Limit, page.GetOffset())
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, pagination.NewPaginatedResponse(page.Page, page.Limit, total, disputes))
}

// GetDispute handles GET /admin/freelance/disputes/:id
func (h *AdminDisputeHandler) GetDispute(c *gin.Context) {
	disputeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dispute ID format"})
		return
	}
	detail, err := h.svc.AdminGetDispute(c.Request.Context(), disputeID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, detail)
}

// ResolveDispute handles POST /admin/freelance/disputes/:id/resolve
func (h *AdminDisputeHandler) ResolveDispute(c *gin.Context) {
	adminID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	disputeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dispute ID format"})
		return
	}
	var payload domain.ResolveDisputePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "An outcome and a written resolution are required"})
		return
	}
	d, err := h.svc.AdminResolveDispute(c.Request.Context(), adminID, disputeID, payload)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, d)
}

// RegisterAdminDisputeRoutes mounts the administrative dispute surface.
func RegisterAdminDisputeRoutes(api *gin.RouterGroup, handler *AdminDisputeHandler, guard *authz.Guard) {
	if handler == nil {
		return
	}
	admin := api.Group("/admin/freelance/disputes")
	admin.Use(sharedMiddleware.RequireAdmin())
	{
		admin.GET("", guard.Require(adminDomain.PermFreelanceAdminRead), handler.ListDisputes)
		admin.GET("/:id", guard.Require(adminDomain.PermFreelanceAdminRead), handler.GetDispute)
		admin.POST("/:id/resolve", guard.Require(adminDomain.PermFreelanceAdminWrite), handler.ResolveDispute)
	}
}
