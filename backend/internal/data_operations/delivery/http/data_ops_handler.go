package http

import (
	"net/http"
	"strconv"

	"kirmya/internal/data_operations/models"
	"kirmya/internal/data_operations/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DataOperationsHandler struct {
	service *service.DataOperationsService
}

func NewDataOperationsHandler(s *service.DataOperationsService) *DataOperationsHandler {
	return &DataOperationsHandler{service: s}
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

func (h *DataOperationsHandler) RequestUserExport(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	exp, err := h.service.CreateUserExport(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, exp)
}

func (h *DataOperationsHandler) ListUserExports(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.ListExports(c.Request.Context(), &userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *DataOperationsHandler) PreviewImport(c *gin.Context) {
	var req models.PreviewImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	preview, err := h.service.PreviewImport(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, preview)
}

func (h *DataOperationsHandler) CreateImport(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.CreateImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imp, err := h.service.CreateImport(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, imp)
}

func (h *DataOperationsHandler) ListAdminImports(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.ListImports(c.Request.Context(), nil, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *DataOperationsHandler) GetImportByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid import ID format"})
		return
	}

	imp, err := h.service.GetImportByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, imp)
}

func (h *DataOperationsHandler) CreateAdminExport(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.CreateExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exp, err := h.service.CreateAdminExport(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, exp)
}

func (h *DataOperationsHandler) ListAdminExports(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.ListExports(c.Request.Context(), nil, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *DataOperationsHandler) ExecuteBulkOperation(c *gin.Context) {
	adminID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.ExecuteBulkOpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	op, err := h.service.ExecuteBulkOperation(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, op)
}

func (h *DataOperationsHandler) ListBulkOperations(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.ListBulkOperations(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *DataOperationsHandler) ListDataMigrations(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))

	list, err := h.service.ListDataMigrations(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}
