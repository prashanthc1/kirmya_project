package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/legal/service"
)

type LegalHandler struct {
	legalService service.LegalService
}

func NewLegalHandler(legalService service.LegalService) *LegalHandler {
	return &LegalHandler{legalService: legalService}
}

// GetDocument returns a legal document by slug.
func (h *LegalHandler) GetDocument(c *gin.Context) {
	slug := c.Param("slug")
	doc, err := h.legalService.GetDocument(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": doc})
}

// GetDocumentVersions returns historical versions for a document.
func (h *LegalHandler) GetDocumentVersions(c *gin.Context) {
	slug := c.Param("slug")
	versions, err := h.legalService.GetDocumentVersions(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": versions})
}

// GetCookies returns the platform cookie registry.
func (h *LegalHandler) GetCookies(c *gin.Context) {
	cookies, err := h.legalService.GetCookies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": cookies})
}

// SaveCookieConsent records cookie category preferences.
func (h *LegalHandler) SaveCookieConsent(c *gin.Context) {
	var body struct {
		VisitorID   string          `json:"visitor_id" binding:"required"`
		Preferences map[string]bool `json:"preferences" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userID *uuid.UUID
	if val, ok := c.Get("userID"); ok {
		if id, valid := val.(uuid.UUID); valid {
			userID = &id
		}
	}

	err := h.legalService.SaveCookieConsent(c.Request.Context(), body.VisitorID, userID, body.Preferences, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Cookie preferences saved successfully."})
}

// RequestDataExport creates an asynchronous data export job.
func (h *LegalHandler) RequestDataExport(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	job, err := h.legalService.RequestDataExport(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": job})
}

// RequestAccountDeletion initiates account deletion request.
func (h *LegalHandler) RequestAccountDeletion(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&body)

	delReq, err := h.legalService.RequestAccountDeletion(c.Request.Context(), userID, body.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": delReq})
}
