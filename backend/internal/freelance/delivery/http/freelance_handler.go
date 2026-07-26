package http

import (
	"net/http"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	clientID := h.getUserID(c)
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

	freelancerID := h.getUserID(c)
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

	clientID := h.getUserID(c)
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
	userID := h.getUserID(c)
	contracts, err := h.svc.GetUserContracts(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
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

	userID := h.getUserID(c)
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
	userID := h.getUserID(c)
	prof, err := h.svc.GetProfileByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, prof)
}

func (h *FreelanceHandler) getUserID(c *gin.Context) uuid.UUID {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		return uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	}
	return userID
}
