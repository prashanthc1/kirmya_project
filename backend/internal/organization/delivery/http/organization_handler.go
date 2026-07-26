package http

import (
	"net/http"

	"kirmya/internal/organization/domain"
	"kirmya/internal/organization/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrganizationHandler struct {
	svc service.OrganizationService
}

func NewOrganizationHandler(svc service.OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{svc: svc}
}

// CreateOrganization handles POST /organizations
func (h *OrganizationHandler) CreateOrganization(c *gin.Context) {
	var payload domain.CreateOrganizationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	org, err := h.svc.CreateOrganization(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Enterprise organization created successfully",
		"organization": org,
	})
}

// GetOrganizationsForUser handles GET /organizations
func (h *OrganizationHandler) GetOrganizationsForUser(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	orgs, err := h.svc.GetOrganizationsForUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  orgs,
		"count": len(orgs),
	})
}

// AddMember handles POST /organizations/:id/members
func (h *OrganizationHandler) AddMember(c *gin.Context) {
	idStr := c.Param("id")
	orgID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID format"})
		return
	}

	var payload domain.InviteMemberPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member invite payload", "details": err.Error()})
		return
	}

	member, err := h.svc.AddMember(c.Request.Context(), orgID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Organization member invited successfully",
		"member":  member,
	})
}

// GetOrgMembers handles GET /organizations/:id/members
func (h *OrganizationHandler) GetOrgMembers(c *gin.Context) {
	idStr := c.Param("id")
	orgID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID format"})
		return
	}

	members, err := h.svc.GetOrgMembers(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  members,
		"count": len(members),
	})
}

// GetAllPermissions handles GET /organizations/permissions
func (h *OrganizationHandler) GetAllPermissions(c *gin.Context) {
	perms, err := h.svc.GetAllPermissions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  perms,
		"count": len(perms),
	})
}
