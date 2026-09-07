package http

import (
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/google/uuid"

	"kirmya/internal/applications/models"
	"kirmya/internal/applications/repository"
	"kirmya/internal/applications/service"
)

type ApplicationsHandler struct {
	svc *service.ApplicationsService
}

func NewApplicationsHandler(svc *service.ApplicationsService) *ApplicationsHandler {
	return &ApplicationsHandler{svc: svc}
}

// POST /api/v1/applications or POST /api/v1/jobs/:id/apply
func (h *ApplicationsHandler) ApplyToJob(c *gin.Context) {
	candID, ok := h.getCandidateID(c)
	if !ok {
		return
	}
	// The path identifier is resolved before the body is validated. On
	// POST /jobs/:id/apply the job is named by the URL, so binding a body that
	// requires job_id rejected every correct request to that alias: the caller
	// was told "Invalid request payload" for a request whose job was never
	// ambiguous. Binding is therefore done without the required-field
	// constraint, and the identifier is required afterwards from whichever
	// source supplied it.
	var pathJobID uuid.UUID
	if jobIDStr := c.Param("id"); jobIDStr != "" {
		parsed, err := uuid.Parse(jobIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
			return
		}
		pathJobID = parsed
	}

	var payload models.CreateApplicationPayload
	// An absent body is legitimate on the aliased route, where the path already
	// carries the job. It is not legitimate on POST /applications, which the
	// job_id check below still rejects.
	if err := c.ShouldBindBodyWith(&payload, binding.JSON); err != nil && !errors.Is(err, io.EOF) {
		if pathJobID == uuid.Nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}
		// The path names the job, so re-read the optional fields without the
		// binding constraint that only the body-only route needs.
		var optional models.CreateApplicationOptionalPayload
		if err := c.ShouldBindBodyWith(&optional, binding.JSON); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}
		payload = optional.ToCreateApplicationPayload()
	}

	// A path identifier and a conflicting body identifier are a caller error
	// rather than something to silently resolve in one direction.
	if pathJobID != uuid.Nil {
		if payload.JobID != uuid.Nil && payload.JobID != pathJobID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "job_id in the body does not match the job in the URL"})
			return
		}
		payload.JobID = pathJobID
	}

	if payload.JobID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "job_id is required"})
		return
	}

	detail, err := h.svc.CreateApplication(c.Request.Context(), candID, payload)
	if err != nil {
		if strings.Contains(err.Error(), "already applied") {
			c.JSON(http.StatusConflict, gin.H{"error": "You have already applied to this job"})
			return
		}
		if strings.Contains(err.Error(), "no longer accepting") || strings.Contains(err.Error(), "expired") || strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, detail)
}

func (h *ApplicationsHandler) getCandidateID(c *gin.Context) (uuid.UUID, bool) {
	// Only the key the auth middleware actually sets is consulted; the
	// former "user_id" fallback was dead and matched the identity-defect
	// scan.
	val, exists := c.Get("userID")
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
		if strings.Contains(err.Error(), "cannot transition") || strings.Contains(err.Error(), "not authorized") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Application withdrawn successfully"})
}

// POST /api/v1/applications/:id/archive
func (h *ApplicationsHandler) ArchiveApplication(c *gin.Context) {
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

	err = h.svc.ArchiveApplication(c.Request.Context(), candID, appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Application archived successfully"})
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
		// A foreign or unknown application is the same 404 either way, so the
		// response never confirms that someone else's application exists.
		if errors.Is(err, repository.ErrApplicationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
			return
		}
		// Anything else is a real failure and must not be reported as an empty
		// timeline.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not load application timeline"})
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

// GET /api/v1/jobs/:id/saved-state
func (h *ApplicationsHandler) GetJobSavedState(c *gin.Context) {
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

	isSaved, err := h.svc.IsJobSaved(c.Request.Context(), candID, jobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"job_id": jobID, "is_saved": isSaved})
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

// GET /api/v1/applications/ai-insights & GET /api/v1/applications/insights
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
