package http

import (
	"net/http"

	"kirmya/internal/native_mobile/domain"
	"kirmya/internal/native_mobile/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type NativeMobileHandler struct {
	svc service.NativeMobileService
}

func NewNativeMobileHandler(svc service.NativeMobileService) *NativeMobileHandler {
	return &NativeMobileHandler{svc: svc}
}

// RefreshToken handles POST /mobile/auth/refresh
func (h *NativeMobileHandler) RefreshToken(c *gin.Context) {
	var payload domain.RefreshTokenPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid refresh token payload", "details": err.Error()})
		return
	}

	accessToken, refreshToken, err := h.svc.RefreshToken(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
		"expires_in":    86400,
	})
}

// RegisterDevice handles POST /mobile/devices/register
func (h *NativeMobileHandler) RegisterDevice(c *gin.Context) {
	var dev domain.UserDevice
	if err := c.ShouldBindJSON(&dev); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device payload", "details": err.Error()})
		return
	}

	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	pushToken := &domain.PushToken{
		DeviceID: dev.DeviceID,
		Provider: dev.Platform,
	}

	if err := h.svc.RegisterDevice(c.Request.Context(), userID, &dev, pushToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Native mobile device & push token registered successfully",
		"device":  dev,
	})
}

// SendPushNotification handles POST /mobile/push/send
func (h *NativeMobileHandler) SendPushNotification(c *gin.Context) {
	var payload domain.PushNotificationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid push payload", "details": err.Error()})
		return
	}

	if payload.UserID == uuid.Nil {
		resolved, ok := h.getUserID(c)
		if !ok {
			return
		}
		payload.UserID = resolved
	}

	if err := h.svc.SendPushNotification(c.Request.Context(), payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Push notification alert dispatched successfully",
	})
}

// GetMobileUserProfile handles GET /mobile/user/profile
func (h *NativeMobileHandler) GetMobileUserProfile(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	prof, err := h.svc.GetMobileUserProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, prof)
}

// GetMobileUserJobs handles GET /mobile/user/jobs
func (h *NativeMobileHandler) GetMobileUserJobs(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	jobs, err := h.svc.GetMobileUserJobs(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": jobs, "count": len(jobs)})
}

// GetMobileUserApplications handles GET /mobile/user/applications
func (h *NativeMobileHandler) GetMobileUserApplications(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	apps, err := h.svc.GetMobileUserApplications(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": apps, "count": len(apps)})
}

// GetMobileUserMessages handles GET /mobile/user/messages
func (h *NativeMobileHandler) GetMobileUserMessages(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	msgs, err := h.svc.GetMobileUserMessages(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": msgs, "count": len(msgs)})
}

// GetMobileUserNotifications handles GET /mobile/user/notifications
func (h *NativeMobileHandler) GetMobileUserNotifications(c *gin.Context) {
	userID, ok := h.getUserID(c)
	if !ok {
		return
	}
	notifs, err := h.svc.GetMobileUserNotifications(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": notifs, "count": len(notifs)})
}

// getUserID returns the verified caller, reporting failure instead of
// substituting a shared synthetic identity.
func (h *NativeMobileHandler) getUserID(c *gin.Context) (uuid.UUID, bool) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return uuid.Nil, false
	}
	return userID, true
}
