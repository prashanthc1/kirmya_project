package http

import (
	"net/http"
	"strconv"

	"kirmya/internal/backup/models"
	"kirmya/internal/backup/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BackupHandler struct {
	service *service.BackupService
}

func NewBackupHandler(s *service.BackupService) *BackupHandler {
	return &BackupHandler{service: s}
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

func (h *BackupHandler) GetHealthSummary(c *gin.Context) {
	health, err := h.service.GetHealthSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, health)
}

func (h *BackupHandler) ListBackups(c *gin.Context) {
	backupType := c.Query("type")
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.ListBackupRecords(c.Request.Context(), backupType, status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *BackupHandler) GetBackupByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid backup ID format"})
		return
	}

	record, err := h.service.GetBackupByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, record)
}

func (h *BackupHandler) TriggerBackup(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.TriggerBackupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record, err := h.service.TriggerBackup(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

func (h *BackupHandler) VerifyBackup(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid backup ID format"})
		return
	}

	ver, err := h.service.VerifyBackup(c.Request.Context(), adminID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ver)
}

func (h *BackupHandler) ListRestoreTests(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	tests, err := h.service.ListRestoreTests(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tests)
}

func (h *BackupHandler) RunRestoreTest(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.RunRestoreTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rt, err := h.service.RunRestoreTest(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, rt)
}

func (h *BackupHandler) ConfirmProductionRestore(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.ConfirmProductionRestoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.ConfirmProductionRestore(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *BackupHandler) GetConfiguration(c *gin.Context) {
	cfg, err := h.service.GetConfiguration(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

func (h *BackupHandler) UpdateConfiguration(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var cfg models.BackupConfiguration
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateConfiguration(c.Request.Context(), adminID, &cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Backup configuration updated successfully"})
}

func (h *BackupHandler) ListIncidents(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.ListIncidents(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *BackupHandler) CreateIncident(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.CreateRecoveryIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	inc, err := h.service.CreateIncident(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, inc)
}

func (h *BackupHandler) GetDataTierClassifications(c *gin.Context) {
	tiers := h.service.GetDataTierClassifications()
	c.JSON(http.StatusOK, tiers)
}
