package http

import (
	"net/http"

	"kirmya/internal/resume_analysis/domain"
	"kirmya/internal/resume_analysis/service"
	"kirmya/internal/shared/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
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

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
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
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	history, err := h.svc.GetUserAnalysisHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"data":  history,
		"count": len(history),
	})
}
