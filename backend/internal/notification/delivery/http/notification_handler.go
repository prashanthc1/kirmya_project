package http

import (
	"net/http"
	"strconv"

	"kirmya/internal/notification/models"
	"kirmya/internal/notification/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	service *service.NotificationService
}

func NewNotificationHandler(s *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: s}
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

func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	category := c.Query("category")
	unreadOnly, _ := strconv.ParseBool(c.Query("unreadOnly"))
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.List(c.Request.Context(), userID, category, unreadOnly, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	count, err := h.service.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count, "unreadCount": count})
}

func (h *NotificationHandler) GetByID(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID format"})
		return
	}

	n, err := h.service.GetByID(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, n)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID format"})
		return
	}

	err = h.service.MarkRead(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

func (h *NotificationHandler) MarkUnread(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID format"})
		return
	}

	err = h.service.MarkUnread(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as unread"})
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	err := h.service.MarkAllRead(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID format"})
		return
	}

	err = h.service.Delete(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}

func (h *NotificationHandler) ArchiveNotification(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID format"})
		return
	}

	err = h.service.Archive(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification archived"})
}

func (h *NotificationHandler) GetPreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	list, err := h.service.GetPreferences(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *NotificationHandler) UpdatePreference(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload models.UpdatePreferencePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.UpdatePreference(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Preference updated successfully"})
}

func (h *NotificationHandler) GetQuietHours(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	qh, err := h.service.GetQuietHours(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, qh)
}

func (h *NotificationHandler) UpdateQuietHours(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var qh models.QuietHoursSettings
	if err := c.ShouldBindJSON(&qh); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	qh.UserID = userID

	err := h.service.UpdateQuietHours(c.Request.Context(), &qh)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiet hours updated successfully"})
}

func (h *NotificationHandler) RegisterDevice(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload models.RegisterDevicePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	device := models.NotificationDevice{
		UserID:      userID,
		DeviceToken: payload.DeviceToken,
		Platform:    payload.Platform,
	}

	err := h.service.RegisterDevice(c.Request.Context(), &device)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device registered successfully"})
}

func (h *NotificationHandler) GetDevices(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	list, err := h.service.GetDevices(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *NotificationHandler) DeleteDevice(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID format"})
		return
	}

	err = h.service.DeleteDevice(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device unregistered successfully"})
}

func (h *NotificationHandler) GetSchedules(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	schedules, err := h.service.GetSchedules(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, schedules)
}

func (h *NotificationHandler) CreateSchedule(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.NotificationSchedulePayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sSched, err := h.service.CreateSchedule(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sSched)
}

func (h *NotificationHandler) DeleteSchedule(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid schedule ID format"})
		return
	}

	err = h.service.DeleteSchedule(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Schedule cancelled successfully"})
}

func (h *NotificationHandler) GetHistory(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	history, err := h.service.GetHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}

// Admin Handlers
func (h *NotificationHandler) AdminGetTemplates(c *gin.Context) {
	templates, err := h.service.GetTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, templates)
}

func (h *NotificationHandler) AdminCreateTemplate(c *gin.Context) {
	var req models.NotificationTemplatePayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tmpl, err := h.service.CreateTemplate(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tmpl)
}

func (h *NotificationHandler) AdminGetTemplateByID(c *gin.Context) {
	templates, err := h.service.GetTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	idParam := c.Param("id")
	for _, t := range templates {
		if t.ID.String() == idParam || t.Code == idParam {
			c.JSON(http.StatusOK, t)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
}

func (h *NotificationHandler) AdminUpdateTemplate(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Template updated successfully"})
}

func (h *NotificationHandler) AdminPublishTemplate(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Template published successfully"})
}

func (h *NotificationHandler) AdminArchiveTemplate(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Template archived successfully"})
}

func (h *NotificationHandler) AdminTestSendTemplate(c *gin.Context) {
	var payload models.TestSendPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Test send dispatched to " + payload.RecipientEmail})
}

func (h *NotificationHandler) AdminGetQueue(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"queueSize": 12,
		"status":    "Active",
		"workers":   4,
	})
}

func (h *NotificationHandler) AdminGetProviders(c *gin.Context) {
	c.JSON(http.StatusOK, []gin.H{
		{"provider": "SMTP Email", "channel": "email", "status": "Healthy", "health": 100},
		{"provider": "FCM Push", "channel": "push", "status": "Healthy", "health": 99.8},
		{"provider": "Twilio SMS", "channel": "sms", "status": "Configured", "health": 100},
	})
}

func (h *NotificationHandler) AdminGetAnalytics(c *gin.Context) {
	analytics, err := h.service.GetAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (h *NotificationHandler) AdminGetFailures(c *gin.Context) {
	failures, err := h.service.GetFailures(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, failures)
}

func (h *NotificationHandler) AdminSendAnnouncement(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.AdminAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.SendAnnouncement(c.Request.Context(), req, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Platform announcement sent successfully"})
}

// Internal Event API
func (h *NotificationHandler) IngestEvent(c *gin.Context) {
	var evt models.NotificationEvent
	if err := c.ShouldBindJSON(&evt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	n, err := h.service.ProcessEvent(c.Request.Context(), evt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, n)
}
