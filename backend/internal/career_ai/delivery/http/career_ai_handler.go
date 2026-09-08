package http

import (
	"net/http"

	"kirmya/internal/career_ai/domain"
	"kirmya/internal/career_ai/service"
	"kirmya/internal/shared/httpx"

	"github.com/gin-gonic/gin"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type CareerAIHandler struct {
	svc service.CareerAIService
}

func NewCareerAIHandler(svc service.CareerAIService) *CareerAIHandler {
	return &CareerAIHandler{svc: svc}
}

// GenerateCareerAdvice handles POST /career-ai/recommendations
func (h *CareerAIHandler) GenerateCareerAdvice(c *gin.Context) {
	var req domain.GenerateCareerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	rec, err := h.svc.GenerateCareerAdvice(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Career trajectory recommendation generated successfully",
		"recommendation": rec,
	})
}

// AnalyzeResume handles POST /career-ai/resume-feedback
func (h *CareerAIHandler) AnalyzeResume(c *gin.Context) {
	var req domain.ResumeCritiqueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resume critique payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	rec, err := h.svc.AnalyzeResume(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Resume feedback generated successfully",
		"recommendation": rec,
	})
}

// IdentifySkillGaps handles POST /career-ai/skill-gap
func (h *CareerAIHandler) IdentifySkillGaps(c *gin.Context) {
	var req domain.SkillGapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skill gap payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	rec, err := h.svc.IdentifySkillGaps(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Skill gap analysis generated successfully",
		"recommendation": rec,
	})
}

// GenerateJobGuidance handles POST /career-ai/job-guidance
func (h *CareerAIHandler) GenerateJobGuidance(c *gin.Context) {
	var req domain.JobGuidanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job guidance payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	rec, err := h.svc.GenerateJobGuidance(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Job guidance strategy generated successfully",
		"recommendation": rec,
	})
}

// GenerateInterviewPrep handles POST /career-ai/interview-prep
func (h *CareerAIHandler) GenerateInterviewPrep(c *gin.Context) {
	var req domain.InterviewPrepRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview prep payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	rec, err := h.svc.GenerateInterviewPrep(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Interview prep guide generated successfully",
		"recommendation": rec,
	})
}

// GetUserRecommendations handles GET /career-ai/recommendations
func (h *CareerAIHandler) GetUserRecommendations(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	recs, err := h.svc.GetUserRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"data":  recs,
		"count": len(recs),
	})
}

// GetUserUsage handles GET /career-ai/usage
func (h *CareerAIHandler) GetUserUsage(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	logs, err := h.svc.GetUserUsage(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalTokens := 0
	for _, l := range logs {
		totalTokens += l.TotalTokens
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"logs":         logs,
		"total_tokens": totalTokens,
		"count":        len(logs),
	})
}
