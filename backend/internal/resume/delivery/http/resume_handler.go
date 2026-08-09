package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/resume/models"
	"kirmya/internal/resume/service"
)

type ResumeHandler struct {
	service *service.ResumeService
}

func NewResumeHandler(s *service.ResumeService) *ResumeHandler {
	return &ResumeHandler{service: s}
}

func (h *ResumeHandler) getUserID(c *gin.Context) uuid.UUID {
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

func (h *ResumeHandler) ListResumes(c *gin.Context) {
	userID := h.getUserID(c)
	list, err := h.service.ListResumes(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *ResumeHandler) GetResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}

	res, err := h.service.GetResume(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if res == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume not found"})
		return
	}
	c.JSON(http.StatusOK, res)
}

// CreateResumeRequest is the body of POST /api/v1/resumes.
//
// Both fields are optional: an empty body creates a resume called
// "My Resume" from the classic template. The templates the service ships
// with are classic, modern and minimal, but any name is stored as given.
type CreateResumeRequest struct {
	Title        string `json:"title"`
	TemplateName string `json:"templateName"`
}

func (h *ResumeHandler) CreateResume(c *gin.Context) {
	userID := h.getUserID(c)
	var req CreateResumeRequest
	_ = c.ShouldBindJSON(&req)
	if req.Title == "" {
		req.Title = "My Resume"
	}
	if req.TemplateName == "" {
		req.TemplateName = "classic"
	}

	res, err := h.service.CreateResume(c.Request.Context(), userID, req.Title, req.TemplateName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

// UpdateSectionsRequest is the body of PUT /api/v1/resumes/{id}. The sections
// given replace the resume's current ones.
type UpdateSectionsRequest struct {
	Sections []models.ResumeSection `json:"sections"`
}

func (h *ResumeHandler) UpdateResumeSections(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}

	var req UpdateSectionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.UpdateResumeSections(c.Request.Context(), id, req.Sections)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *ResumeHandler) DeleteResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	if err := h.service.DeleteResume(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Resume deleted"})
}

func (h *ResumeHandler) DuplicateResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	res, err := h.service.DuplicateResume(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *ResumeHandler) SetDefaultResume(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	if err := h.service.SetDefaultResume(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Resume set as default"})
}

func (h *ResumeHandler) ListVersions(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	versions, err := h.service.ListVersions(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, versions)
}

func (h *ResumeHandler) ImportResume(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.ImportResumeRequest
	_ = c.ShouldBindJSON(&req)
	res, err := h.service.ImportResume(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

func (h *ResumeHandler) GetTemplates(c *gin.Context) {
	templates, err := h.service.GetTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, templates)
}

func (h *ResumeHandler) AnalyzeResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	analysis, err := h.service.AnalyzeResume(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analysis)
}

func (h *ResumeHandler) OptimizeResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	optimized, err := h.service.OptimizeResume(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, optimized)
}

func (h *ResumeHandler) TailorResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	var req models.TailorJobRequest
	_ = c.ShouldBindJSON(&req)
	resp, err := h.service.TailorResumeForJob(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *ResumeHandler) PreviewResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	res, err := h.service.GetResume(c.Request.Context(), id)
	if err != nil || res == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"previewUrl": fmt.Sprintf("/preview/%s", id), "resume": res})
}

func (h *ResumeHandler) DownloadResume(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	res, err := h.service.GetResume(c.Request.Context(), id)
	if err != nil || res == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume not found"})
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.pdf\"", res.Title))
	c.Header("Content-Type", "application/pdf")
	c.String(http.StatusOK, "%PDF-1.4 Mock PDF Content for "+res.Title)
}

func (h *ResumeHandler) ShareResume(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
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

func (h *ResumeHandler) DeleteShare(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	if err := h.service.DeleteShare(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Share revoked"})
}

func (h *ResumeHandler) GetAnalytics(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume ID"})
		return
	}
	analytics, err := h.service.GetAnalytics(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}
