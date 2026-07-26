package http

import (
	"net/http"

	"kirmya/internal/enterprise_hiring/domain"
	"kirmya/internal/enterprise_hiring/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EnterpriseHandler struct {
	svc service.EnterpriseService
}

func NewEnterpriseHandler(svc service.EnterpriseService) *EnterpriseHandler {
	return &EnterpriseHandler{svc: svc}
}

// GetOverview handles GET /enterprise/overview
func (h *EnterpriseHandler) GetOverview(c *gin.Context) {
	entID := h.getEnterpriseID(c)
	ent, err := h.svc.GetEnterpriseOverview(c.Request.Context(), entID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ent)
}

// GetTeams handles GET /enterprise/teams
func (h *EnterpriseHandler) GetTeams(c *gin.Context) {
	entID := h.getEnterpriseID(c)
	teams, err := h.svc.GetTeams(c.Request.Context(), entID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": teams, "count": len(teams)})
}

// CreateTeam handles POST /enterprise/teams
func (h *EnterpriseHandler) CreateTeam(c *gin.Context) {
	var payload domain.CreateTeamPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team payload", "details": err.Error()})
		return
	}

	entID := h.getEnterpriseID(c)
	actorID := h.getUserID(c)
	team, err := h.svc.CreateTeam(c.Request.Context(), entID, actorID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Enterprise hiring team created successfully",
		"team":    team,
	})
}

// GetCandidatePools handles GET /enterprise/pools
func (h *EnterpriseHandler) GetCandidatePools(c *gin.Context) {
	entID := h.getEnterpriseID(c)
	pools, err := h.svc.GetCandidatePools(c.Request.Context(), entID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": pools, "count": len(pools)})
}

// CreateCandidatePool handles POST /enterprise/pools
func (h *EnterpriseHandler) CreateCandidatePool(c *gin.Context) {
	var payload domain.CreatePoolPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pool payload", "details": err.Error()})
		return
	}

	entID := h.getEnterpriseID(c)
	pool, err := h.svc.CreateCandidatePool(c.Request.Context(), entID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Candidate talent pool created successfully",
		"pool":    pool,
	})
}

// GetAuditLogs handles GET /enterprise/audit-logs
func (h *EnterpriseHandler) GetAuditLogs(c *gin.Context) {
	entID := h.getEnterpriseID(c)
	logs, err := h.svc.GetAuditLogs(c.Request.Context(), entID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": logs, "count": len(logs)})
}

func (h *EnterpriseHandler) getEnterpriseID(c *gin.Context) uuid.UUID {
	entIDStr := c.GetString("enterprise_id")
	entID, err := uuid.Parse(entIDStr)
	if err != nil || entID == uuid.Nil {
		return uuid.MustParse("e1111111-1111-1111-1111-111111111111")
	}
	return entID
}

func (h *EnterpriseHandler) getUserID(c *gin.Context) uuid.UUID {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		return uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	}
	return userID
}
