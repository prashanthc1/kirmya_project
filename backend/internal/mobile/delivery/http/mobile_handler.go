package http

import (
	"net/http"

	"kirmya/internal/mobile/domain"
	"kirmya/internal/mobile/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MobileHandler struct {
	svc service.MobileService
}

func NewMobileHandler(svc service.MobileService) *MobileHandler {
	return &MobileHandler{svc: svc}
}

// RegisterDevice handles POST /mobile/devices
func (h *MobileHandler) RegisterDevice(c *gin.Context) {
	var payload domain.RegisterDevicePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	dev, err := h.svc.RegisterDevice(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Mobile device & push token registered successfully",
		"device":  dev,
	})
}

// CreatePresignedUpload handles POST /mobile/uploads/presign
func (h *MobileHandler) CreatePresignedUpload(c *gin.Context) {
	var payload domain.PresignedUploadPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid upload payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	sess, err := h.svc.CreatePresignedUpload(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Presigned upload URL generated successfully",
		"upload":  sess,
	})
}

// GetMobileConfig handles GET /mobile/config
func (h *MobileHandler) GetMobileConfig(c *gin.Context) {
	cfg, err := h.svc.GetMobileConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// GetOpenAPIDocs handles GET /mobile/docs
func (h *MobileHandler) GetOpenAPIDocs(c *gin.Context) {
	docs, err := h.svc.GetOpenAPIDocs(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, docs)
}
