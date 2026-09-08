package http

import (
	"errors"
	"net/http"

	"kirmya/internal/learning/domain"
	"kirmya/internal/learning/service"
	"kirmya/internal/shared/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

type LearningHandler struct {
	svc service.LearningService
}

func NewLearningHandler(svc service.LearningService) *LearningHandler {
	return &LearningHandler{svc: svc}
}

// GetCourses handles GET /learning/courses
func (h *LearningHandler) GetCourses(c *gin.Context) {
	category := c.Query("category")
	provider := c.Query("provider")
	level := c.Query("level")

	courses, err := h.svc.GetCourses(c.Request.Context(), category, provider, level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  courses,
		"count": len(courses),
	})
}

// GetCourseByID handles GET /learning/courses/:id
func (h *LearningHandler) GetCourseByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID format"})
		return
	}

	course, err := h.svc.GetCourseByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	c.JSON(http.StatusOK, course)
}

// GetLearningPaths handles GET /learning/paths
func (h *LearningHandler) GetLearningPaths(c *gin.Context) {
	category := c.Query("category")
	paths, err := h.svc.GetLearningPaths(c.Request.Context(), category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  paths,
		"count": len(paths),
	})
}

// Enroll handles POST /learning/enroll
func (h *LearningHandler) Enroll(c *gin.Context) {
	var body struct {
		CourseID       uuid.UUID  `json:"course_id" binding:"required"`
		LearningPathID *uuid.UUID `json:"learning_path_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid enrollment parameters", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	progress, err := h.svc.EnrollUser(c.Request.Context(), userID, body.CourseID, body.LearningPathID)
	if err != nil {
		if errors.Is(err, service.ErrCourseNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "enrollment failed"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Enrolled successfully",
		"progress": progress,
	})
}

// UpdateProgress handles POST /learning/progress
func (h *LearningHandler) UpdateProgress(c *gin.Context) {
	var req domain.UpdateProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid progress update payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	progress, err := h.svc.UpdateProgress(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Progress updated successfully",
		"progress": progress,
	})
}

// GetUserProgress handles GET /learning/progress
func (h *LearningHandler) GetUserProgress(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	progressList, err := h.svc.GetUserProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"data":  progressList,
		"count": len(progressList),
	})
}

// GetCertificates handles GET /learning/certificates
func (h *LearningHandler) GetCertificates(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	certs, err := h.svc.GetUserCertificates(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	httpx.JSONList(c, http.StatusOK, gin.H{
		"certificates": certs,
		"count":        len(certs),
	})
}

// SubmitSkillAssessment handles POST /learning/assessment
func (h *LearningHandler) SubmitSkillAssessment(c *gin.Context) {
	var req domain.SubmitAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assessment payload", "details": err.Error()})
		return
	}

	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	assessment, err := h.svc.SubmitSkillAssessment(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Skill assessment evaluated successfully",
		"assessment": assessment,
	})
}
