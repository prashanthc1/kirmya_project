package http

import (
	"net/http"

	"kirmya/internal/recruiter_ai/domain"
	"kirmya/internal/recruiter_ai/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type RecruiterAIHandler struct {
	svc service.RecruiterAIService
}

func NewRecruiterAIHandler(svc service.RecruiterAIService) *RecruiterAIHandler {
	return &RecruiterAIHandler{svc: svc}
}

// RankCandidates handles POST /recruiter-ai/rank-candidates
func (h *RecruiterAIHandler) RankCandidates(c *gin.Context) {
	var payload domain.RankCandidatesPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ranking payload", "details": err.Error()})
		return
	}

	orgID := h.getTenantOrgID(c)
	recruiterID, ok := h.getUserID(c)
	if !ok {
		return
	}

	sess, scores, err := h.svc.RankCandidates(c.Request.Context(), orgID, recruiterID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session":          sess,
		"candidate_scores": scores,
		"count":            len(scores),
	})
}

// GenerateInterviewQuestions handles POST /recruiter-ai/interview-questions
func (h *RecruiterAIHandler) GenerateInterviewQuestions(c *gin.Context) {
	var payload domain.GenerateQuestionsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid questions payload", "details": err.Error()})
		return
	}

	orgID := h.getTenantOrgID(c)
	recruiterID, ok := h.getUserID(c)
	if !ok {
		return
	}

	content, err := h.svc.GenerateInterviewQuestions(c.Request.Context(), orgID, recruiterID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Candidate interview questions generated successfully",
		"content": content,
	})
}

// OptimizeJobDescription handles POST /recruiter-ai/optimize-jd
func (h *RecruiterAIHandler) OptimizeJobDescription(c *gin.Context) {
	var payload domain.OptimizeJDPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JD payload", "details": err.Error()})
		return
	}

	orgID := h.getTenantOrgID(c)
	recruiterID, ok := h.getUserID(c)
	if !ok {
		return
	}

	content, err := h.svc.OptimizeJobDescription(c.Request.Context(), orgID, recruiterID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Job description optimized for 24% higher engagement",
		"content": content,
	})
}

// DraftOutreachEmail handles POST /recruiter-ai/outreach-email
func (h *RecruiterAIHandler) DraftOutreachEmail(c *gin.Context) {
	var payload domain.OutreachEmailPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid outreach payload", "details": err.Error()})
		return
	}

	orgID := h.getTenantOrgID(c)
	recruiterID, ok := h.getUserID(c)
	if !ok {
		return
	}

	content, err := h.svc.DraftOutreachEmail(c.Request.Context(), orgID, recruiterID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Candidate outreach email drafted",
		"content": content,
	})
}

// GetRecruiterSessions handles GET /recruiter-ai/sessions
func (h *RecruiterAIHandler) GetRecruiterSessions(c *gin.Context) {
	orgID := h.getTenantOrgID(c)

	sessions, err := h.svc.GetRecruiterSessions(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  sessions,
		"count": len(sessions),
	})
}

func (h *RecruiterAIHandler) getTenantOrgID(c *gin.Context) uuid.UUID {
	tenantIDStr := c.GetHeader("X-Tenant-ID")
	orgID, err := uuid.Parse(tenantIDStr)
	if err != nil || orgID == uuid.Nil {
		return uuid.MustParse("00000000-0000-0000-0000-000000000000")
	}
	return orgID
}

// getUserID returns the verified caller, reporting failure instead of
// substituting a shared synthetic identity.
func (h *RecruiterAIHandler) getUserID(c *gin.Context) (uuid.UUID, bool) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return uuid.Nil, false
	}
	return userID, true
}
