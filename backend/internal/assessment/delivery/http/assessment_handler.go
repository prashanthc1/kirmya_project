package http

import (
	"net/http"

	"kirmya/internal/assessment/domain"
	"kirmya/internal/assessment/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AssessmentHandler struct {
	svc service.AssessmentService
}

func NewAssessmentHandler(svc service.AssessmentService) *AssessmentHandler {
	return &AssessmentHandler{svc: svc}
}

// GetAssessments handles GET /assessments
func (h *AssessmentHandler) GetAssessments(c *gin.Context) {
	category := c.Query("category")
	level := c.Query("level")

	list, err := h.svc.GetAssessments(c.Request.Context(), category, level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  list,
		"count": len(list),
	})
}

// GetAssessmentByID handles GET /assessments/:id
func (h *AssessmentHandler) GetAssessmentByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assessment ID format"})
		return
	}

	assessment, err := h.svc.GetAssessmentForRunner(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
		return
	}

	c.JSON(http.StatusOK, assessment)
}

// SubmitAssessment handles POST /assessments/:id/submit
func (h *AssessmentHandler) SubmitAssessment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assessment ID format"})
		return
	}

	var req domain.SubmitTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission payload", "details": err.Error()})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}
	userName := c.GetString("user_name")
	if userName == "" {
		userName = "Alex Rivera"
	}

	result, err := h.svc.SubmitAssessment(c.Request.Context(), userID, userName, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Assessment evaluated successfully",
		"result":  result,
	})
}

// GetUserResults handles GET /assessments/results
func (h *AssessmentHandler) GetUserResults(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	results, err := h.svc.GetUserResults(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"results": results,
		"count":   len(results),
	})
}

// GetUserBadges handles GET /assessments/badges
func (h *AssessmentHandler) GetUserBadges(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		userID = uuid.New()
	}

	badges, err := h.svc.GetUserBadges(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"badges": badges,
		"count":  len(badges),
	})
}
