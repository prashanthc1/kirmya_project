package http

import (
	"net/http"

	"kirmya/internal/workforce_intelligence/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	userID := h.getUserID(c)

	recs, err := h.svc.GetUserCareerRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": recs, "count": len(recs)})
}

func (h *IntelligenceHandler) getUserID(c *gin.Context) uuid.UUID {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		return uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	}
	return userID
}
