package http

import (
	"net/http"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/service"
	"kirmya/internal/shared/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type FreelanceHandler struct {
	svc service.FreelanceService
}

func NewFreelanceHandler(svc service.FreelanceService) *FreelanceHandler {
	return &FreelanceHandler{svc: svc}
}

// CreateProject handles POST /freelance/projects
func (h *FreelanceHandler) CreateProject(c *gin.Context) {
	var payload domain.CreateProjectPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project payload", "details": err.Error()})
		return
	}

	clientID, ok := h.getUserID(c)
	if !ok {
		return
	}
	proj, err := h.svc.CreateProject(c.Request.Context(), clientID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Short-term freelance project posted successfully",
		"project": proj,
	})
}

// GetProjects handles GET /freelance/projects
func (h *FreelanceHandler) GetProjects(c *gin.Context) {
	status := c.Query("status")
	projects, err := h.svc.GetProjects(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  projects,
		"count": len(projects),
	})
}

// GetProjectByID handles GET /freelance/projects/:id
func (h *FreelanceHandler) GetProjectByID(c *gin.Context) {
	idStr := c.Param("id")
	projID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	proj, err := h.svc.GetProjectByID(c.Request.Context(), projID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, proj)
}

// SubmitProposal handles POST /freelance/projects/:id/proposals
func (h *FreelanceHandler) SubmitProposal(c *gin.Context) {
	idStr := c.Param("id")
	projID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	var payload domain.SubmitProposalPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid proposal payload", "details": err.Error()})
		return
	}

	freelancerID, ok := h.getUserID(c)
	if !ok {
		return
	}
	prop, err := h.svc.SubmitProposal(c.Request.Context(), freelancerID, projID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Proposal submitted successfully to client",
		"proposal": prop,
	})
}

// AcceptProposal handles POST /freelance/proposals/:id/accept
func (h *FreelanceHandler) AcceptProposal(c *gin.Context) {
	idStr := c.Param("id")
	propID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid proposal ID format"})
		return
	}

	clientID, ok := h.getUserID(c)
	if !ok {
		return
	}
	contract, err := h.svc.AcceptProposal(c.Request.Context(), clientID, propID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Proposal accepted and active contract created",
		"contract": contract,
	})
}

// GetUserContracts handles GET /freelance/contracts
func (h *FreelanceHandler) GetUserContracts(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	contracts, err := h.svc.GetUserContracts(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"data":  contracts,
		"count": len(contracts),
	})
}

// SaveProfile handles POST /freelance/profile
func (h *FreelanceHandler) SaveProfile(c *gin.Context) {
	var payload domain.SaveProfilePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile payload", "details": err.Error()})
		return
	}

	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	prof, err := h.svc.SaveProfile(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Freelancer profile updated successfully",
		"profile": prof,
	})
}

// GetProfile handles GET /freelance/profile
func (h *FreelanceHandler) GetProfile(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	prof, err := h.svc.GetProfileByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, prof)
}

// getUserID returns the verified caller. It reports failure rather than
// substituting an identity: the previous fallback handed every
// unauthenticated caller the same synthetic UUID, so their reads and
// writes all landed on one shared account.
func (h *FreelanceHandler) getUserID(c *gin.Context) (uuid.UUID, bool) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return uuid.Nil, false
	}
	return userID, true
}
