package http

import (
	"net/http"

	"kirmya/internal/recruiter/models"
	"kirmya/internal/recruiter/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RecruiterHandler struct {
	service *service.RecruiterService
}

func NewRecruiterHandler(s *service.RecruiterService) *RecruiterHandler {
	return &RecruiterHandler{service: s}
}

func (h *RecruiterHandler) GetProfile(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.GetOrCreateProfile(c.Request.Context(), userID, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *RecruiterHandler) GetDashboardOverview(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	overview, err := h.service.GetDashboardOverview(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, overview)
}

func (h *RecruiterHandler) CreateJob(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var payload models.CreateJobPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job, err := h.service.CreateJob(c.Request.Context(), userID, &payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, job)
}

func (h *RecruiterHandler) GetJobs(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	list, err := h.service.GetJobs(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *RecruiterHandler) GetPipeline(c *gin.Context) {
	jobIDStr := c.Param("jobId")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	list, err := h.service.GetPipeline(c.Request.Context(), jobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *RecruiterHandler) UpdatePipelineStage(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	pipelineIDStr := c.Param("id")
	pipelineID, err := uuid.Parse(pipelineIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline ID"})
		return
	}

	var payload models.UpdateStagePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.UpdatePipelineStage(c.Request.Context(), userID, pipelineID, &payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Pipeline stage updated successfully"})
}

func (h *RecruiterHandler) GetCandidates(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	candidates, err := h.service.GetCandidates(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, candidates)
}

func (h *RecruiterHandler) SaveCandidate(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var payload struct {
		CandidateID string `json:"candidate_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	candID, _ := uuid.Parse(payload.CandidateID)
	err = h.service.SaveCandidate(c.Request.Context(), candID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Candidate saved successfully"})
}

func (h *RecruiterHandler) GetInterviews(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	interviews, err := h.service.GetInterviews(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, interviews)
}

func (h *RecruiterHandler) ScheduleInterview(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var payload models.ScheduleInterviewPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	interview, err := h.service.ScheduleInterview(c.Request.Context(), userID, &payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, interview)
}

func (h *RecruiterHandler) GetAnalytics(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	analytics, err := h.service.GetAnalytics(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

// Enterprise ATS Handlers
func (h *RecruiterHandler) GetApplications(c *gin.Context) {
	userID, _ := h.getUserID(c)
	jobIdStr := c.Query("jobId")
	stageFilter := c.Query("stage")

	apps, err := h.service.GetApplications(c.Request.Context(), userID, jobIdStr, stageFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, apps)
}

func (h *RecruiterHandler) GetApplicationDetail(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	detail, err := h.service.GetApplicationDetail(c.Request.Context(), appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}

func (h *RecruiterHandler) BulkUpdateApplications(c *gin.Context) {
	userID, _ := h.getUserID(c)
	var payload models.ATSBulkActionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.BulkUpdateApplications(c.Request.Context(), userID, &payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Bulk action completed successfully"})
}

func (h *RecruiterHandler) SubmitInterviewFeedback(c *gin.Context) {
	userID, _ := h.getUserID(c)
	var payload models.InterviewFeedbackPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dto, err := h.service.SubmitInterviewFeedback(c.Request.Context(), userID, &payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto)
}

func (h *RecruiterHandler) CreateJobOffer(c *gin.Context) {
	userID, _ := h.getUserID(c)
	var payload models.JobOfferPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dto, err := h.service.CreateJobOffer(c.Request.Context(), userID, &payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto)
}

func (h *RecruiterHandler) UpdateJobOfferStatus(c *gin.Context) {
	userID, _ := h.getUserID(c)
	offerIDStr := c.Param("id")
	offerID, _ := uuid.Parse(offerIDStr)

	var payload struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.UpdateJobOfferStatus(c.Request.Context(), userID, offerID, payload.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Job offer status updated successfully"})
}

func (h *RecruiterHandler) GetAIEvaluation(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, _ := uuid.Parse(appIDStr)

	resp, err := h.service.GetAIEvaluation(c.Request.Context(), appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// Helpers
func (h *RecruiterHandler) getUserID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("userID")
	if !exists {
		return uuid.MustParse("00000000-0000-0000-0000-000000000001"), nil
	}
	uid, ok := val.(uuid.UUID)
	if !ok {
		return uuid.MustParse("00000000-0000-0000-0000-000000000001"), nil
	}
	return uid, nil
}
