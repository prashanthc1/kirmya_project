package http

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/service"
	"kirmya/internal/shared/pagination"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// The owner-scoped project surface.
//
// Every handler here resolves the caller from the verified session and hands it
// to the service, which is what decides whether the row is theirs. No handler
// reads an owner id from the request body or the query string: that is the
// difference between "my projects" and "anybody's projects".

// respondDomainError maps a service refusal onto a status code.
//
// One place, so a new handler cannot invent a different code for the same
// refusal. The important case is ErrNotFound: the service deliberately returns
// it for a row that exists but belongs to somebody else, and answering 404 here
// is what stops an attacker from using the status code to discover which ids are
// real. A 403 would confirm the resource.
func respondDomainError(c *gin.Context, err error) {
	var validation *domain.ValidationError
	var transition *domain.TransitionError

	switch {
	case errors.As(err, &validation):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": validation.Error(),
			"field": validation.Field,
			"code":  "FREELANCE_VALIDATION_FAILED",
		})
	case errors.As(err, &transition):
		// 409 rather than 400: the request was well-formed and the caller is
		// allowed to make it, but the resource is not in a state that permits it.
		c.JSON(http.StatusConflict, gin.H{
			"error": transition.Error(),
			"from":  transition.From,
			"to":    transition.To,
			"code":  "FREELANCE_ILLEGAL_TRANSITION",
		})
	case errors.Is(err, domain.ErrUnauthenticated):
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
	case errors.Is(err, domain.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
	case errors.Is(err, domain.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this resource"})
	case errors.Is(err, domain.ErrConflict):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case errors.Is(err, service.ErrFreelancerSuspended):
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Freelancing has been suspended for this account.",
			"code":  CodeFreelancerAccessSuspended,
		})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not complete the request"})
	}
}

// EnableFreelanceProfile handles POST /freelance/profile/enable
//
// Turns freelancing on for the caller. The capability it produces is 'pending':
// enabling is not activation, and onboarding still has to be completed.
func (h *FreelanceHandler) EnableFreelanceProfile(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	status, err := h.svc.EnableFreelanceProfile(c.Request.Context(), userID)
	if err != nil {
		respondDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, status)
}

// GetOwnProject handles GET /freelance/my/projects/:id
func (h *FreelanceHandler) GetOwnProject(c *gin.Context) {
	clientID, ok := h.getUserID(c)
	if !ok {
		return
	}
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	proj, err := h.svc.GetOwnProject(c.Request.Context(), clientID, projectID)
	if err != nil {
		respondDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, proj)
}

// ListOwnProjects handles GET /freelance/my/projects
//
// Paginated with the repository's existing envelope (shared/pagination), not a
// shape invented for this module: page, limit, total_items, total_pages, data.
func (h *FreelanceHandler) ListOwnProjects(c *gin.Context) {
	clientID, ok := h.getUserID(c)
	if !ok {
		return
	}

	filter, err := parseProjectFilter(c)
	if err != nil {
		respondDomainError(c, err)
		return
	}

	page := pagination.GetPageParams(c)
	projects, total, err := h.svc.ListOwnProjects(c.Request.Context(), clientID, filter, page.Limit, page.GetOffset())
	if err != nil {
		respondDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, pagination.NewPaginatedResponse(page.Page, page.Limit, total, projects))
}

// UpdateOwnProject handles PATCH /freelance/my/projects/:id
func (h *FreelanceHandler) UpdateOwnProject(c *gin.Context) {
	clientID, ok := h.getUserID(c)
	if !ok {
		return
	}
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	var payload domain.UpdateProjectPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project payload", "details": err.Error()})
		return
	}

	proj, err := h.svc.UpdateOwnProject(c.Request.Context(), clientID, projectID, payload)
	if err != nil {
		respondDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, proj)
}

// parseProjectFilter reads the shared filter vocabulary off the query string.
//
// Every value is validated against a closed set before it reaches the
// repository. The sort key in particular: it ends up selecting an ORDER BY, and
// the only safe way to let a caller choose one is to make them choose from a
// list the server owns.
//
// ClientID is not read here at all. It is set by the service from the
// authenticated session, so no query parameter can retarget the listing.
func parseProjectFilter(c *gin.Context) (domain.ProjectFilter, error) {
	filter := domain.ProjectFilter{}

	for _, raw := range splitList(c.Query("status")) {
		parsed, ok := domain.ParseProjectStatus(raw)
		if !ok {
			return filter, domain.NewValidationError("status", "is not a project status")
		}
		filter.Statuses = append(filter.Statuses, parsed)
	}

	if raw := strings.TrimSpace(c.Query("budget_type")); raw != "" {
		parsed, ok := domain.ParseBudgetType(raw)
		if !ok {
			return filter, domain.NewValidationError("budget_type", "must be fixed or hourly")
		}
		filter.BudgetType = &parsed
	}

	if raw := strings.TrimSpace(c.Query("currency")); raw != "" {
		normalized, err := domain.NormalizeCurrency(raw)
		if err != nil {
			return filter, domain.NewValidationError("currency",
				"must be one of "+strings.Join(domain.SupportedCurrencies(), ", "))
		}
		filter.Currency = normalized
	}

	// Budget bounds arrive as minor units, the same unit they are stored in, so
	// the filter needs no conversion and cannot introduce a rounding error at
	// the boundary of a range.
	if raw := strings.TrimSpace(c.Query("min_budget_minor_units")); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || value < 0 {
			return filter, domain.NewValidationError("min_budget_minor_units", "must be a non-negative whole number")
		}
		filter.MinBudget = &value
	}
	if raw := strings.TrimSpace(c.Query("max_budget_minor_units")); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || value < 0 {
			return filter, domain.NewValidationError("max_budget_minor_units", "must be a non-negative whole number")
		}
		filter.MaxBudget = &value
	}
	if filter.MinBudget != nil && filter.MaxBudget != nil && *filter.MinBudget > *filter.MaxBudget {
		return filter, domain.NewValidationError("min_budget_minor_units", "cannot be greater than max_budget_minor_units")
	}

	filter.Skills = splitList(c.Query("skills"))
	filter.Search = strings.TrimSpace(c.Query("q"))

	sort, ok := domain.ParseSortKey(c.Query("sort"))
	if !ok {
		return filter, domain.NewValidationError("sort",
			"must be one of newest, oldest, budget_high, budget_low, recently_updated")
	}
	filter.Sort = string(sort)

	return filter, nil
}

// splitList turns "a,b,c" into three trimmed, non-empty values.
func splitList(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
