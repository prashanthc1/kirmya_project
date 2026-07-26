package http

import (
	"net/http"

	"kirmya/internal/career_companion/domain"
	"kirmya/internal/career_companion/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CompanionHandler struct {
	svc service.CompanionService
}

func NewCompanionHandler(svc service.CompanionService) *CompanionHandler {
	return &CompanionHandler{svc: svc}
}

// CreateConversation handles POST /career-companion/conversations
func (h *CompanionHandler) CreateConversation(c *gin.Context) {
	var payload domain.CreateConversationPayload
	_ = c.ShouldBindJSON(&payload)

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	conv, err := h.svc.CreateConversation(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "AI Career Companion conversation started",
		"conversation": conv,
	})
}

// SendMessage handles POST /career-companion/conversations/:id/messages
func (h *CompanionHandler) SendMessage(c *gin.Context) {
	idStr := c.Param("id")
	convID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID format"})
		return
	}

	var payload domain.SendMessagePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	msg, err := h.svc.SendMessage(c.Request.Context(), userID, convID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": msg,
	})
}

// GetUserConversations handles GET /career-companion/conversations
func (h *CompanionHandler) GetUserConversations(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	convs, err := h.svc.GetUserConversations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  convs,
		"count": len(convs),
	})
}

// GenerateRoadmap handles POST /career-companion/roadmap
func (h *CompanionHandler) GenerateRoadmap(c *gin.Context) {
	var payload domain.GenerateRoadmapPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid roadmap payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	plan, err := h.svc.GenerateRoadmap(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Visual career roadmap generated successfully",
		"plan":    plan,
	})
}

// GetLatestCareerPlan handles GET /career-companion/roadmap
func (h *CompanionHandler) GetLatestCareerPlan(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	plan, err := h.svc.GetLatestCareerPlan(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plan)
}

// GetUserContext handles GET /career-companion/context
func (h *CompanionHandler) GetUserContext(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	uctx, err := h.svc.GetUserContext(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, uctx)
}
