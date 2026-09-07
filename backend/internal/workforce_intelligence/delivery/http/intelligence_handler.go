package http

import (
	"net/http"

	"kirmya/internal/workforce_intelligence/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type IntelligenceHandler struct {
	svc service.IntelligenceService
}

func NewIntelligenceHandler(svc service.IntelligenceService) *IntelligenceHandler {
	return &IntelligenceHandler{svc: svc}
}

// GetMarketInsights handles GET /intelligence/market
func (h *IntelligenceHandler) GetMarketInsights(c *gin.Context) {
	industry := c.Query("industry")
	region := c.Query("region")

	insights, err := h.svc.GetMarketInsights(c.Request.Context(), industry, region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": insights, "count": len(insights)})
}

// GetSkillTrends handles GET /intelligence/skills
func (h *IntelligenceHandler) GetSkillTrends(c *gin.Context) {
	trends, err := h.svc.GetSkillTrends(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": trends, "count": len(trends)})
}

// GetHiringStatistics handles GET /intelligence/hiring-stats
func (h *IntelligenceHandler) GetHiringStatistics(c *gin.Context) {
	region := c.Query("region")

	stats, err := h.svc.GetHiringStatistics(c.Request.Context(), region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats, "count": len(stats)})
}

// GetUserCareerRecommendations handles GET /intelligence/user-recommendations
func (h *IntelligenceHandler) GetUserCareerRecommendations(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}

	recs, err := h.svc.GetUserCareerRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": recs, "count": len(recs)})
}

// getUserID returns the verified caller, reporting failure instead of
// substituting a shared synthetic identity.
func (h *IntelligenceHandler) getUserID(c *gin.Context) (uuid.UUID, bool) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return uuid.Nil, false
	}
	return userID, true
}
