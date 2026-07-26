package http

import (
	"net/http"

	"kirmya/internal/resume_analysis/domain"
	"kirmya/internal/resume_analysis/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ResumeAnalysisHandler struct {
	svc service.ResumeAnalysisService
}

func NewResumeAnalysisHandler(svc service.ResumeAnalysisService) *ResumeAnalysisHandler {
	return &ResumeAnalysisHandler{svc: svc}
}

// AnalyzeResume handles POST /resume-analysis/analyze
func (h *ResumeAnalysisHandler) AnalyzeResume(c *gin.Context) {
	var req domain.AnalyzeResumePayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume analysis parameters", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	analysis, err := h.svc.AnalyzeResume(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Resume analysis completed successfully",
		"analysis": analysis,
	})
}

// GetAnalysisByID handles GET /resume-analysis/:id
func (h *ResumeAnalysisHandler) GetAnalysisByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid analysis ID format"})
		return
	}

	analysis, err := h.svc.GetAnalysisByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume analysis report not found"})
		return
	}

	c.JSON(http.StatusOK, analysis)
}

// GetUserAnalysisHistory handles GET /resume-analysis/history
func (h *ResumeAnalysisHandler) GetUserAnalysisHistory(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	history, err := h.svc.GetUserAnalysisHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  history,
		"count": len(history),
	})
}
