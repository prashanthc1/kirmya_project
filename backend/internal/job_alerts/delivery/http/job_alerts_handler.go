package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/job_alerts/models"
	"kirmya/internal/job_alerts/service"
)

type JobAlertsHandler struct {
	svc *service.JobAlertsService
}

func NewJobAlertsHandler(svc *service.JobAlertsService) *JobAlertsHandler {
	return &JobAlertsHandler{svc: svc}
}

func (h *JobAlertsHandler) getUserID(c *gin.Context) uuid.UUID {
	val, exists := c.Get("user_id")
	if !exists {
		// Fallback for demo/development user ID
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

func (h *JobAlertsHandler) GetJobAlerts(c *gin.Context) {
	candidateID := h.getUserID(c)
	alerts, err := h.svc.GetJobAlerts(c.Request.Context(), candidateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

func (h *JobAlertsHandler) CreateJobAlert(c *gin.Context) {
	candidateID := h.getUserID(c)
	var alert models.JobAlert
	if err := c.ShouldBindJSON(&alert); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	created, err := h.svc.CreateJobAlert(c.Request.Context(), candidateID, &alert)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (h *JobAlertsHandler) UpdateJobAlert(c *gin.Context) {
	candidateID := h.getUserID(c)
	idStr := c.Param("id")
	alertID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert id"})
		return
	}

	var alert models.JobAlert
	if err := c.ShouldBindJSON(&alert); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	alert.ID = alertID
	updated, err := h.svc.UpdateJobAlert(c.Request.Context(), candidateID, &alert)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *JobAlertsHandler) DeleteJobAlert(c *gin.Context) {
	candidateID := h.getUserID(c)
	idStr := c.Param("id")
	alertID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert id"})
		return
	}
	if err := h.svc.DeleteJobAlert(c.Request.Context(), candidateID, alertID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "alert deleted"})
}

func (h *JobAlertsHandler) PauseJobAlert(c *gin.Context) {
	candidateID := h.getUserID(c)
	idStr := c.Param("id")
	alertID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert id"})
		return
	}
	if err := h.svc.PauseJobAlert(c.Request.Context(), candidateID, alertID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "alert paused"})
}

func (h *JobAlertsHandler) ResumeJobAlert(c *gin.Context) {
	candidateID := h.getUserID(c)
	idStr := c.Param("id")
	alertID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert id"})
		return
	}
	if err := h.svc.ResumeJobAlert(c.Request.Context(), candidateID, alertID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "alert resumed"})
}

func (h *JobAlertsHandler) GetAlertHistory(c *gin.Context) {
	candidateID := h.getUserID(c)
	history, err := h.svc.GetAlertHistory(c.Request.Context(), candidateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, history)
}

func (h *JobAlertsHandler) GetJobRecommendations(c *gin.Context) {
	userID := h.getUserID(c)
	recs, err := h.svc.GetJobRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, recs)
}

func (h *JobAlertsHandler) GetJobRecommendationByID(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	recID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recommendation id"})
		return
	}
	rec, err := h.svc.GetJobRecommendationByID(c.Request.Context(), userID, recID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rec)
}

func (h *JobAlertsHandler) SubmitRecommendationFeedback(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.RecommendationFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.SubmitFeedback(c.Request.Context(), userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "feedback recorded"})
}

func (h *JobAlertsHandler) GetSavedSearches(c *gin.Context) {
	userID := h.getUserID(c)
	searches, err := h.svc.GetSavedSearches(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, searches)
}

func (h *JobAlertsHandler) CreateSavedSearch(c *gin.Context) {
	userID := h.getUserID(c)
	var search models.SavedSearch
	if err := c.ShouldBindJSON(&search); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	created, err := h.svc.CreateSavedSearch(c.Request.Context(), userID, &search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (h *JobAlertsHandler) UpdateSavedSearch(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	searchID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid search id"})
		return
	}
	var search models.SavedSearch
	if err := c.ShouldBindJSON(&search); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	search.ID = searchID
	updated, err := h.svc.UpdateSavedSearch(c.Request.Context(), userID, &search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *JobAlertsHandler) DeleteSavedSearch(c *gin.Context) {
	userID := h.getUserID(c)
	idStr := c.Param("id")
	searchID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid search id"})
		return
	}
	if err := h.svc.DeleteSavedSearch(c.Request.Context(), userID, searchID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "saved search deleted"})
}

func (h *JobAlertsHandler) GetCareerInsights(c *gin.Context) {
	userID := h.getUserID(c)
	insights, err := h.svc.GetCareerInsights(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, insights)
}
