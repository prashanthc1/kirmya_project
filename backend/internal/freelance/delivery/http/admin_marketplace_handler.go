package http

import (
	"net/http"
	"strings"

	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
	"kirmya/internal/shared/pagination"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// The administrative marketplace surface.
//
// Distinct from AdminFreelanceHandler, which owns the freelancer *capability*
// lifecycle - whether an account may freelance at all. This handler is about the
// marketplace records themselves: the projects, and the authority to take an
// abusive one down.
//
// Both permissions it uses are enforced here and nowhere else, which is what
// keeps internal/admin/domain/rbac.go's stated invariant true: every permission
// in that vocabulary is demanded by a route that exists. A permission seeded
// without a route is authority nobody can exercise and nobody can audit, and it
// reads in a role listing as though the capability were real.
type AdminMarketplaceHandler struct {
	svc service.FreelanceService
}

func NewAdminMarketplaceHandler(svc service.FreelanceService) *AdminMarketplaceHandler {
	return &AdminMarketplaceHandler{svc: svc}
}

// ListProjects handles GET /api/v1/admin/freelance/projects.
//
// The cross-account read a support or trust-and-safety administrator needs to
// answer "what did this client post". It is the same filtered listing clients
// get for their own projects, with the owner scoping removed - which is exactly
// why it is behind a named permission rather than merely behind RequireAdmin().
func (h *AdminMarketplaceHandler) ListProjects(c *gin.Context) {
	filter, err := parseProjectFilter(c)
	if err != nil {
		respondDomainError(c, err)
		return
	}

	// An administrator may narrow to one client explicitly. Unlike the
	// owner-scoped listing, reading this from the query string is the point of
	// the endpoint - and it is gated by the permission above.
	if raw := strings.TrimSpace(c.Query("client_id")); raw != "" {
		clientID, parseErr := uuid.Parse(raw)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client_id format"})
			return
		}
		filter.ClientID = clientID
	}

	page := pagination.GetPageParams(c)
	projects, total, err := h.svc.ListAllProjects(c.Request.Context(), filter, page.Limit, page.GetOffset())
	if err != nil {
		respondDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, pagination.NewPaginatedResponse(page.Page, page.Limit, total, projects))
}

// cancelRequest carries the mandatory reason.
type cancelRequest struct {
	Reason string `json:"reason" binding:"required"`
}

// CancelProject handles POST /api/v1/admin/freelance/projects/:id/cancel.
//
// Taking an abusive or fraudulent project off the marketplace. It moves the
// project to 'cancelled' through the same transition table a client's own edit
// goes through, so an administrator cannot put a project into a state the
// lifecycle does not allow either.
//
// A reason is required, and it is required because the audit entry is the point:
// an administrative removal that records no justification is indistinguishable
// from a mistake when somebody asks about it three months later.
func (h *AdminMarketplaceHandler) CancelProject(c *gin.Context) {
	adminID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	var body cancelRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A reason is required"})
		return
	}

	proj, err := h.svc.AdminCancelProject(c.Request.Context(), adminID, projectID, body.Reason)
	if err != nil {
		respondDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Project cancelled",
		"project": proj,
	})
}

// RegisterAdminMarketplaceRoutes mounts the administrative marketplace surface.
//
// RequireAdmin() is the outer gate and the named permission is the inner one,
// the same two-tier model every other administrative route in Kirmya uses.
func RegisterAdminMarketplaceRoutes(api *gin.RouterGroup, handler *AdminMarketplaceHandler, guard *authz.Guard) {
	if handler == nil {
		return
	}
	admin := api.Group("/admin/freelance")
	admin.Use(sharedMiddleware.RequireAdmin())
	{
		admin.GET("/projects",
			guard.Require(adminDomain.PermFreelanceAdminRead), handler.ListProjects)
		admin.POST("/projects/:id/cancel",
			guard.Require(adminDomain.PermFreelanceAdminWrite), handler.CancelProject)
	}
}
