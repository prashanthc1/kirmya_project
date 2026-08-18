package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/security/models"
	"kirmya/internal/security/service"
)

type SecurityHandler struct {
	securityService service.SecurityService
}

func NewSecurityHandler(securityService service.SecurityService) *SecurityHandler {
	return &SecurityHandler{securityService: securityService}
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

func (h *SecurityHandler) GetSecurityOverview(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	ov, err := h.securityService.GetSecurityOverview(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ov)
}

func (h *SecurityHandler) ValidatePasswordPolicy(c *gin.Context) {
	var body struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res := h.securityService.EvaluatePasswordPolicy(body.Password)
	c.JSON(http.StatusOK, res)
}

func (h *SecurityHandler) ChangePassword(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload models.PasswordChangePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.securityService.ChangePassword(c.Request.Context(), userID, payload.CurrentPassword, payload.NewPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully."})
}

func (h *SecurityHandler) SetupMFA(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	res, err := h.securityService.SetupMFA(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *SecurityHandler) VerifyMFA(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload models.MFAVerifyPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.securityService.VerifyAndEnableMFA(c.Request.Context(), userID, payload.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Two-factor authentication enabled successfully."})
}

func (h *SecurityHandler) DisableMFA(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	err := h.securityService.DisableMFA(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Two-factor authentication disabled."})
}

func (h *SecurityHandler) GetActiveSessions(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	sessions, err := h.securityService.GetActiveSessions(c.Request.Context(), userID, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sessions)
}

func (h *SecurityHandler) RevokeSession(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	err = h.securityService.RevokeSession(c.Request.Context(), userID, sessionID)
	if err != nil {
		if err.Error() == "FORBIDDEN_IDOR: Cannot revoke session belonging to another user account" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session revoked successfully."})
}

func (h *SecurityHandler) RevokeAllOtherSessions(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	err := h.securityService.RevokeAllOtherSessions(c.Request.Context(), userID, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All other sessions revoked successfully."})
}

func (h *SecurityHandler) GetTrustedDevices(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	devices, err := h.securityService.GetTrustedDevices(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, devices)
}

func (h *SecurityHandler) RegisterDevice(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var dev models.DeviceItem
	if err := c.ShouldBindJSON(&dev); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.securityService.RegisterDevice(c.Request.Context(), userID, dev)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *SecurityHandler) UpdateDeviceTrustStatus(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.securityService.UpdateDeviceTrustStatus(c.Request.Context(), userID, deviceID, body.Status)
	if err != nil {
		if err.Error() == "FORBIDDEN_IDOR: Cannot modify device belonging to another user account" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device trust status updated."})
}

func (h *SecurityHandler) RemoveDevice(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	err = h.securityService.RemoveDevice(c.Request.Context(), userID, deviceID)
	if err != nil {
		if err.Error() == "FORBIDDEN_IDOR: Cannot remove device belonging to another user account" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device removed."})
}

func (h *SecurityHandler) GetLoginHistory(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	history, err := h.securityService.GetLoginHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}

func (h *SecurityHandler) CreateAPIKey(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload models.CreateAPIKeyPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	keyRes, err := h.securityService.CreateAPIKey(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, keyRes)
}

func (h *SecurityHandler) GetAPIKeys(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	keys, err := h.securityService.GetAPIKeys(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, keys)
}

func (h *SecurityHandler) RevokeAPIKey(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid API key ID"})
		return
	}

	err = h.securityService.RevokeAPIKey(c.Request.Context(), userID, keyID)
	if err != nil {
		if err.Error() == "FORBIDDEN_IDOR: Cannot revoke API key belonging to another user account" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key revoked."})
}

func (h *SecurityHandler) GetSecurityEvents(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	events, err := h.securityService.GetSecurityEvents(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

func (h *SecurityHandler) GetPrivacySettings(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	settings, err := h.securityService.GetPrivacySettings(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func (h *SecurityHandler) UpdatePrivacySettings(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload models.PrivacySettingsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings, err := h.securityService.UpdatePrivacySettings(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func (h *SecurityHandler) RequestDataExport(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	exportReq, err := h.securityService.RequestDataExport(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, exportReq)
}

func (h *SecurityHandler) GetDataExports(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	exports, err := h.securityService.GetDataExports(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, exports)
}

func (h *SecurityHandler) RequestAccountDeletion(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var body struct {
		Reason          string `json:"reason"`
		ConfirmPassword string `json:"confirm_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	delReq, err := h.securityService.RequestAccountDeletion(c.Request.Context(), userID, body.Reason, body.ConfirmPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, delReq)
}

func (h *SecurityHandler) GetAccountDeletionStatus(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	status, err := h.securityService.GetAccountDeletionStatus(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, status)
}

func (h *SecurityHandler) CancelAccountDeletion(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	err := h.securityService.CancelAccountDeletion(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deletion request cancelled."})
}

func (h *SecurityHandler) GetAccountRiskScore(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	score, err := h.securityService.GetAccountRiskScore(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, score)
}

