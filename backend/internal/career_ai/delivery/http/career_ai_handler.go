package http

import (
	"net/http"

	"kirmya/internal/career_ai/domain"
	"kirmya/internal/career_ai/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
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

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
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

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
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

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
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

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
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
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	recs, err := h.svc.GetUserRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  recs,
		"count": len(recs),
	})
}

// GetUserUsage handles GET /career-ai/usage
func (h *CareerAIHandler) GetUserUsage(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
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

	c.JSON(http.StatusOK, gin.H{
		"logs":         logs,
		"total_tokens": totalTokens,
		"count":        len(logs),
	})
}
