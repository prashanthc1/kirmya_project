package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/legal/models"
	"kirmya/internal/legal/service"
)

type LegalHandler struct {
	legalService service.LegalService
}

func NewLegalHandler(legalService service.LegalService) *LegalHandler {
	return &LegalHandler{legalService: legalService}
}

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	userID, ok := val.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid context type"})
		return uuid.Nil, false
	}
	return userID, true
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

// GetPrivacyPreferences fetches user privacy controls.
func (h *LegalHandler) GetPrivacyPreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	prefs, err := h.legalService.GetPrivacyPreferences(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, prefs)
}

// UpdatePrivacyPreferences updates fine-grained privacy controls.
func (h *LegalHandler) UpdatePrivacyPreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload models.UpdatePrivacyPreferencesPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prefs, err := h.legalService.UpdatePrivacyPreferences(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, prefs)
}

// GetConsentHistory returns user consent audit entries.
func (h *LegalHandler) GetConsentHistory(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	history, err := h.legalService.GetConsentHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}

// GetUserPrivacyRequests retrieves user SAR requests.
func (h *LegalHandler) GetUserPrivacyRequests(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	reqs, err := h.legalService.GetUserPrivacyRequests(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reqs)
}

// CreatePrivacyRequest files a new Subject Access Request (SAR).
func (h *LegalHandler) CreatePrivacyRequest(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var body struct {
		RequestType string `json:"request_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req, err := h.legalService.CreatePrivacyRequest(c.Request.Context(), userID, body.RequestType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

// GetPrivacyRequestByID fetches a specific user SAR request.
func (h *LegalHandler) GetPrivacyRequestByID(c *gin.Context) {
	_, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID format"})
		return
	}

	req, err := h.legalService.GetPrivacyRequestByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Privacy request not found"})
		return
	}

	c.JSON(http.StatusOK, req)
}

// RequestDataExport creates an asynchronous data export job.
func (h *LegalHandler) RequestDataExport(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	job, err := h.legalService.RequestDataExport(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, job)
}

// GetDataExportJob returns current export status.
func (h *LegalHandler) GetDataExportJob(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	job, err := h.legalService.GetDataExportJob(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, job)
}

// RequestAccountDeletion initiates account deletion request.
func (h *LegalHandler) RequestAccountDeletion(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&body)

	delReq, err := h.legalService.RequestAccountDeletion(c.Request.Context(), userID, body.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, delReq)
}

// CancelAccountDeletion cancels pending account deletion during grace period.
func (h *LegalHandler) CancelAccountDeletion(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	err := h.legalService.CancelAccountDeletion(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deletion cancelled successfully."})
}

// GetRetentionPolicies returns active data retention durations.
func (h *LegalHandler) GetRetentionPolicies(c *gin.Context) {
	policies, err := h.legalService.GetRetentionPolicies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, policies)
}
