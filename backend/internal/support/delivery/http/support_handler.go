package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/support/models"
	"kirmya/internal/support/service"
)

type SupportHandler struct {
	supportService service.SupportService
}

func NewSupportHandler(supportService service.SupportService) *SupportHandler {
	return &SupportHandler{supportService: supportService}
}

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, false
	}
	userID, ok := val.(uuid.UUID)
	return userID, ok
}

// Public Help Center Endpoints
func (h *SupportHandler) GetCategories(c *gin.Context) {
	cats, err := h.supportService.GetCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cats)
}

func (h *SupportHandler) GetArticles(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")
	articles, err := h.supportService.GetArticles(c.Request.Context(), category, search, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, articles)
}

func (h *SupportHandler) GetArticleBySlug(c *gin.Context) {
	slug := c.Param("slug")
	article, err := h.supportService.GetArticleBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	c.JSON(http.StatusOK, article)
}

func (h *SupportHandler) RecordArticleFeedback(c *gin.Context) {
	articleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
		return
	}

	var body models.ArticleFeedbackPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userIDPtr *uuid.UUID
	if uid, ok := getUserID(c); ok {
		userIDPtr = &uid
	}

	err = h.supportService.RecordArticleFeedback(c.Request.Context(), articleID, userIDPtr, body.IsHelpful, body.Feedback)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Feedback recorded."})
}

// User Ticket Endpoints
func (h *SupportHandler) CreateTicket(c *gin.Context) {
	var payload models.CreateTicketPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userIDPtr *uuid.UUID
	if uid, ok := getUserID(c); ok {
		userIDPtr = &uid
	}

	ticket, err := h.supportService.CreateTicket(c.Request.Context(), userIDPtr, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

func (h *SupportHandler) GetUserTickets(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return
	}

	tickets, err := h.supportService.GetUserTickets(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tickets)
}

func (h *SupportHandler) GetTicketByID(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	ticket, err := h.supportService.GetTicketByID(c.Request.Context(), ticketID, false)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

func (h *SupportHandler) GetTicketMessages(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	messages, err := h.supportService.GetTicketMessages(c.Request.Context(), ticketID, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *SupportHandler) AddMessage(c *gin.Context) {
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

	var senderIDPtr *uuid.UUID
	if uid, ok := getUserID(c); ok {
		senderIDPtr = &uid
	}

	msg, err := h.supportService.AddMessage(c.Request.Context(), ticketID, senderIDPtr, "user", false, body.MessageText, body.Attachments)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, msg)
}

func (h *SupportHandler) CloseTicket(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	err = h.supportService.CloseTicket(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket closed successfully."})
}

func (h *SupportHandler) ReopenTicket(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	err = h.supportService.ReopenTicket(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket reopened."})
}

func (h *SupportHandler) RecordCSAT(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	var body models.CSATFeedbackPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.supportService.RecordCSAT(c.Request.Context(), ticketID, body.Rating, body.Feedback)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Satisfaction rating recorded. Thank you for your feedback!"})
}

func (h *SupportHandler) CreateFeatureRequest(c *gin.Context) {
	var body models.CreateFeatureRequestPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userIDPtr *uuid.UUID
	if uid, ok := getUserID(c); ok {
		userIDPtr = &uid
	}

	req, err := h.supportService.CreateFeatureRequest(c.Request.Context(), userIDPtr, body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *SupportHandler) CreateBugReport(c *gin.Context) {
	var body models.CreateBugReportPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userIDPtr *uuid.UUID
	if uid, ok := getUserID(c); ok {
		userIDPtr = &uid
	}

	bug, err := h.supportService.CreateBugReport(c.Request.Context(), userIDPtr, body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bug)
}
