package http

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kirmya/internal/applications/models"
	"kirmya/internal/applications/service"
)

type ApplicationsHandler struct {
	svc *service.ApplicationsService
}

func NewApplicationsHandler(svc *service.ApplicationsService) *ApplicationsHandler {
	return &ApplicationsHandler{svc: svc}
}

// POST /api/v1/applications
func (h *ApplicationsHandler) ApplyToJob(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	var payload models.CreateApplicationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if jobIDStr := c.Param("id"); jobIDStr != "" && payload.JobID == uuid.Nil {
		if jID, err := uuid.Parse(jobIDStr); err == nil {
			payload.JobID = jID
		}
	}

	detail, err := h.svc.CreateApplication(c.Request.Context(), candID, payload)
	if err != nil {
		if strings.Contains(err.Error(), "already applied") {
			c.JSON(http.StatusConflict, gin.H{"error": "You have already applied to this job"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, detail)
}

func (h *ApplicationsHandler) getCandidateID(c *gin.Context) (uuid.UUID, bool) {
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

// GET /api/v1/applications
func (h *ApplicationsHandler) GetApplications(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	status := c.Query("status")
	search := c.Query("search")

	apps, err := h.svc.GetCandidateApplications(c.Request.Context(), candID, status, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, apps)
}

// GET /api/v1/applications/:id
func (h *ApplicationsHandler) GetApplicationByID(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	idStr := c.Param("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	detail, err := h.svc.GetApplicationByID(c.Request.Context(), candID, appID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}
	c.JSON(http.StatusOK, detail)
}

// PUT /api/v1/applications/:id/withdraw
func (h *ApplicationsHandler) WithdrawApplication(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	idStr := c.Param("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	err = h.svc.WithdrawApplication(c.Request.Context(), candID, appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Application withdrawn successfully"})
}

// GET /api/v1/applications/:id/timeline
func (h *ApplicationsHandler) GetApplicationTimeline(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	idStr := c.Param("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	timeline, err := h.svc.GetApplicationTimeline(c.Request.Context(), candID, appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, timeline)
}

// GET /api/v1/jobs/saved
func (h *ApplicationsHandler) GetSavedJobs(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	jobs, err := h.svc.GetSavedJobs(c.Request.Context(), candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

// POST /api/v1/jobs/:id/save
func (h *ApplicationsHandler) SaveJob(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	var payload struct {
		Notes string `json:"notes"`
	}
	_ = c.ShouldBindJSON(&payload)

	err = h.svc.SaveJob(c.Request.Context(), candID, jobID, payload.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Job saved successfully"})
}

// DELETE /api/v1/jobs/:id/save
func (h *ApplicationsHandler) RemoveSavedJob(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	err = h.svc.RemoveSavedJob(c.Request.Context(), candID, jobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Saved job removed successfully"})
}

// GET /api/v1/job-alerts
func (h *ApplicationsHandler) GetJobAlerts(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	alerts, err := h.svc.GetJobAlerts(c.Request.Context(), candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

// POST /api/v1/job-alerts
func (h *ApplicationsHandler) CreateJobAlert(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	var payload models.CreateJobAlertPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	alert, err := h.svc.CreateJobAlert(c.Request.Context(), candID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, alert)
}

// DELETE /api/v1/job-alerts/:id
func (h *ApplicationsHandler) DeleteJobAlert(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	alertIDStr := c.Param("id")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	err = h.svc.DeleteJobAlert(c.Request.Context(), candID, alertID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Job alert deleted successfully"})
}

// GET /api/v1/interviews
func (h *ApplicationsHandler) GetCandidateInterviews(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	interviews, err := h.svc.GetCandidateInterviews(c.Request.Context(), candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, interviews)
}

// GET /api/v1/documents
func (h *ApplicationsHandler) GetCandidateDocuments(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	docs, err := h.svc.GetCandidateDocuments(c.Request.Context(), candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, docs)
}

// POST /api/v1/documents/upload
func (h *ApplicationsHandler) UploadDocument(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	var payload struct {
		Title        string `json:"title"`
		DocumentType string `json:"document_type"`
		FileURL      string `json:"file_url"`
		IsDefault    bool   `json:"is_default"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doc := models.CandidateDocument{
		ID:           uuid.New(),
		CandidateID:  candID,
		Title:        payload.Title,
		DocumentType: payload.DocumentType,
		FileURL:      payload.FileURL,
		SizeBytes:    1048576,
		FileType:     "application/pdf",
		IsDefault:    payload.IsDefault,
		UploadedAt:   time.Now(),
	}
	c.JSON(http.StatusCreated, doc)
}

// DELETE /api/v1/documents/:id
func (h *ApplicationsHandler) DeleteDocument(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	docIDStr := c.Param("id")
	docID, err := uuid.Parse(docIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	err = h.svc.DeleteDocument(c.Request.Context(), candID, docID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Document deleted successfully"})
}

// GET /api/v1/applications/analytics
func (h *ApplicationsHandler) GetAnalytics(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	stats, err := h.svc.GetApplicationStats(c.Request.Context(), candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	analytics, _ := h.svc.GetCareerAnalytics(c.Request.Context(), candID)
	c.JSON(http.StatusOK, gin.H{
		"stats":     stats,
		"analytics": analytics,
	})
}

// GET /api/v1/applications/ai-insights
func (h *ApplicationsHandler) GetAIInsights(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	insights, err := h.svc.GetAIInsights(c.Request.Context(), candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, insights)
}
