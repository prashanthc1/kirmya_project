package http

import (
	"errors"
	"net/http"

	"kirmya/internal/compliance/domain"
	"kirmya/internal/compliance/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ComplianceHandler struct {
	svc          service.ComplianceService
	AdminHandler *AdminComplianceHandler
}

func NewComplianceHandler(svc service.ComplianceService) *ComplianceHandler {
	return &ComplianceHandler{
		svc:          svc,
		AdminHandler: NewAdminComplianceHandler(svc),
	}
}

func (h *ComplianceHandler) getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		val, exists = c.Get("user_id")
	}
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	switch v := val.(type) {
	case string:
		u, err := uuid.Parse(v)
		if err == nil && u != uuid.Nil {
			return u, true
		}
	case uuid.UUID:
		if v != uuid.Nil {
			return v, true
		}
	}
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized user context"})
	return uuid.Nil, false
}

// UpdateConsent handles POST /compliance/consent
func (h *ComplianceHandler) UpdateConsent(c *gin.Context) {
	var payload domain.UpdateConsentPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid consent payload", "details": err.Error()})
		return
	}

	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	ipAddress := c.ClientIP()

	if err := h.svc.UpdateConsent(c.Request.Context(), userID, payload, ipAddress); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Privacy consent setting updated successfully"})
}

// GetUserConsents handles GET /compliance/consent
func (h *ComplianceHandler) GetUserConsents(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	consents, err := h.svc.GetUserConsents(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": consents, "count": len(consents)})
}

// RequestDataExport handles POST /compliance/export
func (h *ComplianceHandler) RequestDataExport(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	req, err := h.svc.RequestDataExport(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "GDPR Data Export package generated successfully",
		"request": req,
	})
}

// DownloadDataExport handles GET /compliance/export/download
func (h *ComplianceHandler) DownloadDataExport(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	pkg, err := h.svc.GenerateDataExportPackage(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "GDPR Data Export Package retrieved successfully",
		"data":    pkg,
	})
}

// RequestAccountDeletion handles POST /compliance/delete-account
func (h *ComplianceHandler) RequestAccountDeletion(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	req, err := h.svc.RequestAccountDeletion(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserUnderLegalHold) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "ACCOUNT_DELETION_BLOCKED",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Account Deletion request received (Right to be Forgotten). Deletion scheduled within 30 days SLA.",
		"request": req,
	})
}

// GetUserDataRequests handles GET /compliance/requests
func (h *ComplianceHandler) GetUserDataRequests(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	reqs, err := h.svc.GetUserDataRequests(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": reqs, "count": len(reqs)})
}

// CreateUserRequest handles POST /compliance/requests
func (h *ComplianceHandler) CreateUserRequest(c *gin.Context) {
	var payload domain.CreateDataRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	if payload.RequestType == domain.RequestTypeDeletion {
		req, err := h.svc.RequestAccountDeletion(c.Request.Context(), userID)
		if err != nil {
			if errors.Is(err, domain.ErrUserUnderLegalHold) {
				c.JSON(http.StatusForbidden, gin.H{"error": "ACCOUNT_DELETION_BLOCKED", "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "Deletion request created", "data": req})
		return
	}

	req, err := h.svc.RequestDataExport(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Data request created", "data": req})
}
