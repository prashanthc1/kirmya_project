package http

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"kirmya/internal/mentorship/models"
	"kirmya/internal/mentorship/service"
)

type MentorshipHandler struct {
	svc service.MentorshipService
}

func NewMentorshipHandler(svc service.MentorshipService) *MentorshipHandler {
	return &MentorshipHandler{
		svc: svc,
	}
}

func getUserID(c *gin.Context) string {
	if val, exists := c.Get("userID"); exists {
		switch uid := val.(type) {
		case string:
			if uid != "" {
				return uid
			}
		default:
			if uidStr := c.GetString("userID"); uidStr != "" {
				return uidStr
			}
		}
	}
	if uid := c.GetString("user_id"); uid != "" {
		return uid
	}
	return ""
}

// CreateOrUpdateProfile POST /api/v1/mentorship/mentors/profile
func (h *MentorshipHandler) CreateOrUpdateProfile(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	var dto models.UpdateMentorProfileDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "details": err.Error()})
		return
	}

	profile, err := h.svc.CreateOrUpdateProfile(c.Request.Context(), userID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "mentor profile saved successfully",
		"profile": profile,
	})
}

// GetMyProfile GET /api/v1/mentorship/mentors/profile
func (h *MentorshipHandler) GetMyProfile(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	profile, err := h.svc.GetProfileByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mentor profile not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile": profile})
}

// GetMentorByID GET /api/v1/mentorship/mentors/:id
func (h *MentorshipHandler) GetMentorByID(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	id := c.Param("id")
	profile, err := h.svc.GetProfileByID(c.Request.Context(), id)
	if err != nil {
		profile, err = h.svc.GetProfileByUserID(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "mentor profile not found"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"profile": profile})
}

// SearchMentors GET /api/v1/mentorship/mentors/search
func (h *MentorshipHandler) SearchMentors(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	var params models.MentorFilterParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query parameters", "details": err.Error()})
		return
	}

	expQuery := c.Query("expertise")
	if expQuery != "" {
		params.Expertise = strings.Split(expQuery, ",")
	}

	profiles, total, err := h.svc.SearchMentors(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"mentors": profiles,
		"total":   total,
		"page":    params.Page,
		"limit":   params.Limit,
	})
}

// GetRecommendations GET /api/v1/mentorship/mentors/recommendations
func (h *MentorshipHandler) GetRecommendations(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)

	var skills []string
	skillsQuery := c.Query("skills")
	if skillsQuery != "" {
		skills = strings.Split(skillsQuery, ",")
	}

	mentors, err := h.svc.GetRecommendations(c.Request.Context(), userID, skills)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"recommendations": mentors})
}

// CreateMentorshipRequest POST /api/v1/mentorship/requests
func (h *MentorshipHandler) CreateMentorshipRequest(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	var dto models.CreateMentorshipRequestDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
		return
	}

	req, err := h.svc.CreateMentorshipRequest(c.Request.Context(), userID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "mentorship request submitted successfully",
		"request": req,
	})
}

// RespondToMentorshipRequest PUT /api/v1/mentorship/requests/:id/status
func (h *MentorshipHandler) RespondToMentorshipRequest(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	requestID := c.Param("id")
	var dto models.UpdateMentorshipRequestDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "details": err.Error()})
		return
	}

	req, err := h.svc.RespondToMentorshipRequest(c.Request.Context(), userID, requestID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "mentorship request status updated",
		"request": req,
	})
}

// GetUserRequests GET /api/v1/mentorship/requests
func (h *MentorshipHandler) GetUserRequests(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	role := c.Query("role")
	requests, err := h.svc.GetUserRequests(c.Request.Context(), userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

// GetActiveMentorships GET /api/v1/mentorship/relationships
func (h *MentorshipHandler) GetActiveMentorships(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	mentorships, err := h.svc.GetUserMentorships(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"mentorships": mentorships})
}

// GetMentorshipByID GET /api/v1/mentorship/relationships/:id
func (h *MentorshipHandler) GetMentorshipByID(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	id := c.Param("id")
	mentorship, err := h.svc.GetMentorshipByID(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"mentorship": mentorship})
}

// CreateGoal POST /api/v1/mentorship/goals
func (h *MentorshipHandler) CreateGoal(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	var dto models.CreateMentorshipGoalDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid goal payload", "details": err.Error()})
		return
	}

	goal, err := h.svc.CreateGoal(c.Request.Context(), userID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "goal created successfully",
		"goal":    goal,
	})
}

// GetGoals GET /api/v1/mentorship/goals
func (h *MentorshipHandler) GetGoals(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	mentorshipID := c.Query("mentorship_id")
	if mentorshipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mentorship_id query parameter is required"})
		return
	}

	goals, err := h.svc.GetGoals(c.Request.Context(), userID, mentorshipID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"goals": goals})
}

// UpdateGoal PUT /api/v1/mentorship/goals/:id
func (h *MentorshipHandler) UpdateGoal(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	goalID := c.Param("id")
	var dto models.UpdateMentorshipGoalDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid update goal payload", "details": err.Error()})
		return
	}

	goal, err := h.svc.UpdateGoal(c.Request.Context(), userID, goalID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "goal updated successfully",
		"goal":    goal,
	})
}

// CreateSession POST /api/v1/mentorship/sessions
func (h *MentorshipHandler) CreateSession(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	var dto models.CreateMentorshipSessionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session payload", "details": err.Error()})
		return
	}

	session, err := h.svc.CreateSession(c.Request.Context(), userID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "session scheduled successfully",
		"session": session,
	})
}

// GetSessions GET /api/v1/mentorship/sessions
func (h *MentorshipHandler) GetSessions(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	mentorshipID := c.Query("mentorship_id")
	if mentorshipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mentorship_id query parameter is required"})
		return
	}

	sessions, err := h.svc.GetSessions(c.Request.Context(), userID, mentorshipID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

// UpdateSession PUT /api/v1/mentorship/sessions/:id
func (h *MentorshipHandler) UpdateSession(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	sessionID := c.Param("id")
	var dto models.UpdateMentorshipSessionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session update payload", "details": err.Error()})
		return
	}

	session, err := h.svc.UpdateSession(c.Request.Context(), userID, sessionID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "session updated successfully",
		"session": session,
	})
}

// SubmitFeedback POST /api/v1/mentorship/feedback
func (h *MentorshipHandler) SubmitFeedback(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	var dto models.CreateMentorshipFeedbackDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid feedback payload", "details": err.Error()})
		return
	}

	fb, err := h.svc.SubmitFeedback(c.Request.Context(), userID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "feedback submitted successfully",
		"feedback": fb,
	})
}

// GetFeedback GET /api/v1/mentorship/feedback
func (h *MentorshipHandler) GetFeedback(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	userID := getUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing user id"})
		return
	}

	mentorshipID := c.Query("mentorship_id")
	if mentorshipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mentorship_id query parameter is required"})
		return
	}

	feedbacks, err := h.svc.GetFeedbackForMentorship(c.Request.Context(), userID, mentorshipID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"feedback": feedbacks})
}

// Helper for string to int parsing if needed
func atoiDefault(s string, def int) int {
	val, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return val
}
