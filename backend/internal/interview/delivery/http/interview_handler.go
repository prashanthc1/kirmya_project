package http

import (
	"net/http"

	"kirmya/internal/interview/domain"
	"kirmya/internal/interview/service"
	"kirmya/internal/shared/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type InterviewHandler struct {
	svc service.InterviewService
}

func NewInterviewHandler(svc service.InterviewService) *InterviewHandler {
	return &InterviewHandler{svc: svc}
}

// ScheduleInterview handles POST /interviews
func (h *InterviewHandler) ScheduleInterview(c *gin.Context) {
	var req domain.CreateInterviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input parameters", "details": err.Error()})
		return
	}

	organizerID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	interview, err := h.svc.ScheduleInterview(c.Request.Context(), organizerID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Interview scheduled successfully",
		"interview": interview,
	})
}

// GetInterview handles GET /interviews/:id
func (h *InterviewHandler) GetInterview(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview ID format"})
		return
	}

	interview, err := h.svc.GetInterview(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Interview not found"})
		return
	}

	c.JSON(http.StatusOK, interview)
}

// ListInterviews handles GET /interviews
func (h *InterviewHandler) ListInterviews(c *gin.Context) {
	var candidateIDPtr, organizerIDPtr *uuid.UUID

	if cidStr := c.Query("candidate_id"); cidStr != "" {
		if cid, err := uuid.Parse(cidStr); err == nil {
			candidateIDPtr = &cid
		}
	}
	if oidStr := c.Query("organizer_id"); oidStr != "" {
		if oid, err := uuid.Parse(oidStr); err == nil {
			organizerIDPtr = &oid
		}
	}
	status := c.Query("status")

	interviews, err := h.svc.ListInterviews(c.Request.Context(), candidateIDPtr, organizerIDPtr, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"data":  interviews,
		"count": len(interviews),
	})
}

// UpdateInterviewStatus handles PUT /interviews/:id/status
func (h *InterviewHandler) UpdateInterviewStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview ID format"})
		return
	}

	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	if err := h.svc.UpdateInterviewStatus(c.Request.Context(), id, body.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interview status updated successfully", "status": body.Status})
}

// AddRound handles POST /interviews/:id/rounds
func (h *InterviewHandler) AddRound(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview ID format"})
		return
	}

	var req domain.CreateRoundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid round data", "details": err.Error()})
		return
	}

	round, err := h.svc.AddRound(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Interview round added successfully",
		"round":   round,
	})
}

// UpdateRoundStatus handles PUT /interviews/rounds/:roundId/status
func (h *InterviewHandler) UpdateRoundStatus(c *gin.Context) {
	roundIDStr := c.Param("roundId")
	roundID, err := uuid.Parse(roundIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid round ID format"})
		return
	}

	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	if err := h.svc.UpdateRoundStatus(c.Request.Context(), roundID, body.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Round status updated successfully"})
}

// SubmitFeedback handles POST /interviews/rounds/:roundId/feedback
func (h *InterviewHandler) SubmitFeedback(c *gin.Context) {
	roundIDStr := c.Param("roundId")
	roundID, err := uuid.Parse(roundIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid round ID format"})
		return
	}

	var req domain.SubmitFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid feedback data", "details": err.Error()})
		return
	}

	interviewerID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	interviewerName := c.GetString("user_name")
	if interviewerName == "" {
		interviewerName = "Interviewer"
	}

	feedback, err := h.svc.SubmitFeedback(c.Request.Context(), roundID, interviewerID, interviewerName, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Feedback submitted successfully",
		"feedback": feedback,
	})
}

// GetRoundFeedback handles GET /interviews/rounds/:roundId/feedback
func (h *InterviewHandler) GetRoundFeedback(c *gin.Context) {
	roundIDStr := c.Param("roundId")
	roundID, err := uuid.Parse(roundIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid round ID format"})
		return
	}

	feedbackList, err := h.svc.GetRoundFeedback(c.Request.Context(), roundID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  feedbackList,
		"count": len(feedbackList),
	})
}

// SetAvailability handles POST /interviews/availability
func (h *InterviewHandler) SetAvailability(c *gin.Context) {
	var req domain.SetAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid availability parameters", "details": err.Error()})
		return
	}

	candidateID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	avail, err := h.svc.SetCandidateAvailability(c.Request.Context(), candidateID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Availability slot saved successfully",
		"availability": avail,
	})
}

// GetCandidateAvailability handles GET /interviews/availability/:candidateId
func (h *InterviewHandler) GetCandidateAvailability(c *gin.Context) {
	candidateIDStr := c.Param("candidateId")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid candidate ID format"})
		return
	}

	availList, err := h.svc.GetCandidateAvailability(c.Request.Context(), candidateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  availList,
		"count": len(availList),
	})
}

// GetReminders handles GET /interviews/reminders
func (h *InterviewHandler) GetReminders(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	reminders, err := h.svc.GetRemindersForUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"reminders": reminders,
		"count":     len(reminders),
	})
}
