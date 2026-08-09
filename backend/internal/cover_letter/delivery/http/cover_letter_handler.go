package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/cover_letter/models"
	"kirmya/internal/cover_letter/service"
)

type CoverLetterHandler struct {
	service *service.CoverLetterService
}

func NewCoverLetterHandler(s *service.CoverLetterService) *CoverLetterHandler {
	return &CoverLetterHandler{service: s}
}

func (h *CoverLetterHandler) getUserID(c *gin.Context) uuid.UUID {
	val, exists := c.Get("user_id")
	if !exists {
		val, exists = c.Get("userID")
	}
	if !exists {
		return uuid.MustParse("00000000-0000-0000-0000-000000000001")
	}
	if uid, ok := val.(uuid.UUID); ok {
		return uid
	}
	if uidStr, ok := val.(string); ok {
		if parsed, err := uuid.Parse(uidStr); err == nil {
			return parsed
		}
	}
	return uuid.MustParse("00000000-0000-0000-0000-000000000001")
}

func (h *CoverLetterHandler) ListCoverLetters(c *gin.Context) {
	userID := h.getUserID(c)
	list, err := h.service.ListCoverLetters(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *CoverLetterHandler) GetCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}

	cl, err := h.service.GetCoverLetter(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if cl == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cover letter not found"})
		return
	}
	c.JSON(http.StatusOK, cl)
}

func (h *CoverLetterHandler) CreateCoverLetter(c *gin.Context) {
	userID := h.getUserID(c)
	var req struct {
		Name         string `json:"name"`
		TemplateName string `json:"templateName"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.Name == "" {
		req.Name = "Cover Letter"
	}

	cl, err := h.service.CreateCoverLetter(c.Request.Context(), userID, req.Name, req.TemplateName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cl)
}

func (h *CoverLetterHandler) UpdateCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}

	var req models.CoverLetter
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cl, err := h.service.UpdateCoverLetter(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cl)
}

func (h *CoverLetterHandler) DeleteCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	if err := h.service.DeleteCoverLetter(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cover letter deleted"})
}

func (h *CoverLetterHandler) DuplicateCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	cl, err := h.service.DuplicateCoverLetter(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cl)
}

func (h *CoverLetterHandler) GenerateCoverLetter(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.GenerateCoverLetterRequest
	_ = c.ShouldBindJSON(&req)
	cl, err := h.service.GenerateCoverLetter(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cl)
}

func (h *CoverLetterHandler) RewriteCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	var req models.RewriteRequest
	_ = c.ShouldBindJSON(&req)
	cl, err := h.service.RewriteContent(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cl)
}

func (h *CoverLetterHandler) TailorCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	var req struct {
		JobDescription string `json:"jobDescription"`
	}
	_ = c.ShouldBindJSON(&req)
	resp, err := h.service.TailorForJob(c.Request.Context(), id, req.JobDescription)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoverLetterHandler) PreviewCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	cl, err := h.service.GetCoverLetter(c.Request.Context(), id)
	if err != nil || cl == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cover letter not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"previewUrl": fmt.Sprintf("/preview/%s", id), "coverLetter": cl})
}

func (h *CoverLetterHandler) DownloadCoverLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	cl, err := h.service.GetCoverLetter(c.Request.Context(), id)
	if err != nil || cl == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cover letter not found"})
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.pdf\"", cl.Name))
	c.Header("Content-Type", "application/pdf")
	c.String(http.StatusOK, "%PDF-1.4 Mock PDF Content for Cover Letter "+cl.Name)
}

func (h *CoverLetterHandler) ShareCoverLetter(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	var req struct {
		PrivacyLevel string `json:"privacyLevel"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.PrivacyLevel == "" {
		req.PrivacyLevel = "Public"
	}
	share, err := h.service.CreateShare(c.Request.Context(), userID, id, req.PrivacyLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, share)
}

func (h *CoverLetterHandler) DeleteShare(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	if err := h.service.DeleteShare(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Share revoked"})
}

func (h *CoverLetterHandler) GetTemplates(c *gin.Context) {
	templates, err := h.service.GetTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, templates)
}

func (h *CoverLetterHandler) ListVersions(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	versions, err := h.service.ListVersions(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, versions)
}

func (h *CoverLetterHandler) CreateVersion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	cl, err := h.service.GetCoverLetter(c.Request.Context(), id)
	if err != nil || cl == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cover letter not found"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Version created"})
}

func (h *CoverLetterHandler) GetAnalytics(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cover letter ID"})
		return
	}
	analytics, err := h.service.GetAnalytics(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}
