package http

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"kirmya/internal/media/domain"
	"kirmya/internal/media/repository"
	"kirmya/internal/media/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FileHandler struct {
	service service.FileService
}

func NewFileHandler(s service.FileService) *FileHandler {
	return &FileHandler{service: s}
}

func (h *FileHandler) getUserIdentity(c *gin.Context) (uuid.UUID, string) {
	var uid uuid.UUID
	if val, exists := c.Get("userID"); exists {
		switch id := val.(type) {
		case uuid.UUID:
			uid = id
		case string:
			uid, _ = uuid.Parse(id)
		}
	}
	if uid == uuid.Nil {
		if val, exists := c.Get("user_id"); exists {
			switch id := val.(type) {
			case uuid.UUID:
				uid = id
			case string:
				uid, _ = uuid.Parse(id)
			}
		}
	}

	role := "user"
	if rVal, exists := c.Get("role"); exists {
		if rStr, ok := rVal.(string); ok && rStr != "" {
			role = rStr
		}
	}

	return uid, role
}

// Upload handles secure multipart file upload.
func (h *FileHandler) Upload(c *gin.Context) {
	userID, _ := h.getUserIdentity(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required for file upload"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Multipart field 'file' is required"})
		return
	}

	category := c.DefaultPostForm("category", domain.CategoryGeneral)
	visibility := c.DefaultPostForm("visibility", domain.VisibilityPrivate)

	record, err := h.service.UploadFile(c.Request.Context(), userID, file, category, visibility, nil)
	if err != nil {
		if errors.Is(err, service.ErrFileTooLarge) || errors.Is(err, service.ErrUnsupportedMediaType) || errors.Is(err, service.ErrInvalidFileName) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

// GetMetadata retrieves file metadata record.
func (h *FileHandler) GetMetadata(c *gin.Context) {
	userID, role := h.getUserIdentity(c)
	fileIDStr := c.Param("id")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	record, err := h.service.GetFile(c.Request.Context(), userID, fileID, role)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) || errors.Is(err, service.ErrFileDeleted) {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		if errors.Is(err, service.ErrUnauthorizedFileAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

// ViewFile streams file content for inline rendering.
func (h *FileHandler) ViewFile(c *gin.Context) {
	userID, role := h.getUserIdentity(c)
	fileIDStr := c.Param("id")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	stream, record, err := h.service.DownloadFile(c.Request.Context(), userID, fileID, role)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) || errors.Is(err, service.ErrFileDeleted) {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		if errors.Is(err, service.ErrUnauthorizedFileAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer stream.Close()

	if record.Visibility == domain.VisibilityPublic {
		c.Header("Cache-Control", "public, max-age=31536000, immutable")
	} else {
		c.Header("Cache-Control", "private, no-cache, no-store, must-revalidate")
	}

	c.Header("Content-Type", record.DetectedContentType)
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%q", record.OriginalFilename))
	c.Header("Content-Length", strconv.FormatInt(record.FileSize, 10))

	_, _ = io.Copy(c.Writer, stream)
}

// DownloadFile streams file with attachment disposition.
func (h *FileHandler) DownloadFile(c *gin.Context) {
	userID, role := h.getUserIdentity(c)
	fileIDStr := c.Param("id")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	stream, record, err := h.service.DownloadFile(c.Request.Context(), userID, fileID, role)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) || errors.Is(err, service.ErrFileDeleted) {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		if errors.Is(err, service.ErrUnauthorizedFileAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer stream.Close()

	c.Header("Content-Type", record.DetectedContentType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", record.OriginalFilename))
	c.Header("Content-Length", strconv.FormatInt(record.FileSize, 10))
	c.Header("Cache-Control", "private, no-cache, no-store, must-revalidate")

	_, _ = io.Copy(c.Writer, stream)
}

// GetSignedURL generates short-lived access URL for authorized client.
func (h *FileHandler) GetSignedURL(c *gin.Context) {
	userID, role := h.getUserIdentity(c)
	fileIDStr := c.Param("id")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	expiryMinutes, _ := strconv.Atoi(c.DefaultQuery("expiry_minutes", "15"))
	if expiryMinutes <= 0 {
		expiryMinutes = 15
	}

	signedResp, err := h.service.GenerateSignedAccessURL(c.Request.Context(), userID, fileID, role, time.Duration(expiryMinutes)*time.Minute)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) || errors.Is(err, service.ErrFileDeleted) {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		if errors.Is(err, service.ErrUnauthorizedFileAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, signedResp)
}

// Delete removes file metadata and purges from storage.
func (h *FileHandler) Delete(c *gin.Context) {
	userID, role := h.getUserIdentity(c)
	fileIDStr := c.Param("id")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	if err := h.service.DeleteFile(c.Request.Context(), userID, fileID, role); err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		if errors.Is(err, service.ErrUnauthorizedFileAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}

// PresignUpload creates a presigned upload URL.
func (h *FileHandler) PresignUpload(c *gin.Context) {
	userID, _ := h.getUserIdentity(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req domain.PresignedUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.service.CreatePresignedUpload(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}
