package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/support/models"
	"kirmya/internal/support/service"
)

type AdminSupportHandler struct {
	supportService service.SupportService
}

func NewAdminSupportHandler(supportService service.SupportService) *AdminSupportHandler {
	return &AdminSupportHandler{supportService: supportService}
}

func getAdminID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, false
	}
	adminID, ok := val.(uuid.UUID)
	return adminID, ok
}

func (h *AdminSupportHandler) GetAnalyticsSummary(c *gin.Context) {
	summary, err := h.supportService.GetAnalyticsSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *AdminSupportHandler) GetAdminTickets(c *gin.Context) {
	status := c.Query("status")
	priority := c.Query("priority")
	category := c.Query("category")
	tickets, err := h.supportService.GetAdminTickets(c.Request.Context(), status, priority, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func (h *AdminSupportHandler) GetTicketByID(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	ticket, err := h.supportService.GetTicketByID(c.Request.Context(), ticketID, true)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

func (h *AdminSupportHandler) GetTicketMessages(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	messages, err := h.supportService.GetTicketMessages(c.Request.Context(), ticketID, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *AdminSupportHandler) AddAgentMessageOrInternalNote(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	var body models.CreateMessagePayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var adminIDPtr *uuid.UUID
	if aid, ok := getAdminID(c); ok {
		adminIDPtr = &aid
	}

	msg, err := h.supportService.AddMessage(c.Request.Context(), ticketID, adminIDPtr, "agent", body.IsInternalNote, body.MessageText, body.Attachments)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, msg)
}

func (h *AdminSupportHandler) AssignTicket(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	var body models.AssignTicketPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var agentIDPtr *uuid.UUID
	if body.AgentID != nil && *body.AgentID != "" {
		if id, err := uuid.Parse(*body.AgentID); err == nil {
			agentIDPtr = &id
		}
	}

	err = h.supportService.AssignTicket(c.Request.Context(), ticketID, agentIDPtr, body.Team)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket assignment updated."})
}

func (h *AdminSupportHandler) ResolveTicket(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	var body struct {
		Notes string `json:"notes"`
	}
	_ = c.ShouldBindJSON(&body)

	err = h.supportService.ResolveTicket(c.Request.Context(), ticketID, body.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket resolved."})
}

func (h *AdminSupportHandler) GetAdminArticles(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")
	articles, err := h.supportService.GetArticles(c.Request.Context(), category, search, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, articles)
}

func (h *AdminSupportHandler) CreateArticle(c *gin.Context) {
	adminID, ok := getAdminID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return
	}

	var body struct {
		Title        string   `json:"title" binding:"required"`
		CategoryCode string   `json:"category_code" binding:"required"`
		Summary      string   `json:"summary" binding:"required"`
		Content      string   `json:"content" binding:"required"`
		Tags         []string `json:"tags"`
		Status       string   `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if body.Status == "" {
		body.Status = "draft"
	}

	article, err := h.supportService.CreateArticle(c.Request.Context(), adminID, body.Title, body.CategoryCode, body.Summary, body.Content, body.Tags, body.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, article)
}

func (h *AdminSupportHandler) GetFeatureRequests(c *gin.Context) {
	reqs, err := h.supportService.GetFeatureRequests(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reqs)
}

func (h *AdminSupportHandler) GetBugReports(c *gin.Context) {
	bugs, err := h.supportService.GetBugReports(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, bugs)
}
