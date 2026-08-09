package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/interview_prep/models"
	"kirmya/internal/interview_prep/service"
)

type InterviewPrepHandler struct {
	service *service.InterviewPrepService
}

func NewInterviewPrepHandler(s *service.InterviewPrepService) *InterviewPrepHandler {
	return &InterviewPrepHandler{service: s}
}

func (h *InterviewPrepHandler) getUserID(c *gin.Context) uuid.UUID {
	val, exists := c.Get("user_id")
	if !exists {
		val, exists = c.Get("userID")
	}
	if !exists {
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

// ----------------- Preparations -----------------

func (h *InterviewPrepHandler) CreatePreparation(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.CreatePreparationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prep, err := h.service.CreatePreparation(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, prep)
}

func (h *InterviewPrepHandler) GetPreparation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid preparation ID"})
		return
	}

	prep, err := h.service.GetPreparation(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Preparation workspace not found"})
		return
	}
	c.JSON(http.StatusOK, prep)
}

func (h *InterviewPrepHandler) ListPreparations(c *gin.Context) {
	userID := h.getUserID(c)
	preps, err := h.service.ListPreparations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, preps)
}

func (h *InterviewPrepHandler) UpdatePreparation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid preparation ID"})
		return
	}
	userID := h.getUserID(c)

	var req models.UpdatePreparationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prep, err := h.service.UpdatePreparation(c.Request.Context(), id, userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, prep)
}

func (h *InterviewPrepHandler) DeletePreparation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid preparation ID"})
		return
	}

	if err := h.service.DeletePreparation(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Preparation deleted successfully"})
}

// ----------------- Questions & AI Generation -----------------

func (h *InterviewPrepHandler) GenerateQuestions(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.GenerateQuestionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	questions, err := h.service.GenerateQuestions(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, questions)
}

func (h *InterviewPrepHandler) SaveQuestion(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.SaveQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	q, err := h.service.SaveQuestion(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, q)
}

func (h *InterviewPrepHandler) ListQuestions(c *gin.Context) {
	userID := h.getUserID(c)
	var prepIDPtr *uuid.UUID
	prepIDStr := c.Query("preparation_id")
	if prepIDStr != "" {
		if parsed, err := uuid.Parse(prepIDStr); err == nil {
			prepIDPtr = &parsed
		}
	}

	questions, err := h.service.ListQuestions(c.Request.Context(), userID, prepIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, questions)
}

func (h *InterviewPrepHandler) UpdateQuestionPractice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	var req models.UpdateQuestionPracticeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	q, err := h.service.UpdateQuestionPractice(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, q)
}

func (h *InterviewPrepHandler) DeleteQuestion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	if err := h.service.DeleteQuestion(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Question deleted successfully"})
}

// ----------------- Mock Sessions & Answers -----------------

func (h *InterviewPrepHandler) StartMockSession(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.StartMockSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.service.StartMockSession(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, session)
}

func (h *InterviewPrepHandler) GetMockSession(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	session, err := h.service.GetMockSession(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mock session not found"})
		return
	}
	c.JSON(http.StatusOK, session)
}

func (h *InterviewPrepHandler) ListMockSessions(c *gin.Context) {
	userID := h.getUserID(c)
	sessions, err := h.service.ListMockSessions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sessions)
}

func (h *InterviewPrepHandler) SubmitMockAnswer(c *gin.Context) {
	idStr := c.Param("id")
	sessionID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	var req models.SubmitMockAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	answer, err := h.service.SubmitMockAnswer(c.Request.Context(), sessionID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, answer)
}

func (h *InterviewPrepHandler) CompleteMockSession(c *gin.Context) {
	idStr := c.Param("id")
	sessionID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	session, err := h.service.CompleteMockSession(c.Request.Context(), sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, session)
}

// ----------------- Tasks -----------------

func (h *InterviewPrepHandler) CreateTask(c *gin.Context) {
	var req models.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.service.CreateTask(c.Request.Context(), req.PreparationID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, task)
}

func (h *InterviewPrepHandler) ListTasks(c *gin.Context) {
	prepIDStr := c.Query("preparation_id")
	prepID, err := uuid.Parse(prepIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid preparation ID query parameter"})
		return
	}

	tasks, err := h.service.ListTasks(c.Request.Context(), prepID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tasks)
}

func (h *InterviewPrepHandler) ToggleTaskCompletion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	isCompletedStr := c.Query("is_completed")
	isCompleted, _ := strconv.ParseBool(isCompletedStr)

	if err := h.service.ToggleTaskCompletion(c.Request.Context(), id, isCompleted); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Task status updated"})
}

func (h *InterviewPrepHandler) DeleteTask(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	if err := h.service.DeleteTask(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// ----------------- Notes & Readiness & Coach -----------------

func (h *InterviewPrepHandler) SaveNote(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.SaveInterviewNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note, err := h.service.SaveNote(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, note)
}

func (h *InterviewPrepHandler) GetNote(c *gin.Context) {
	prepIDStr := c.Query("preparation_id")
	prepID, err := uuid.Parse(prepIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid preparation ID"})
		return
	}

	note, err := h.service.GetNote(c.Request.Context(), prepID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Interview note not found"})
		return
	}
	c.JSON(http.StatusOK, note)
}

func (h *InterviewPrepHandler) GetReadinessScore(c *gin.Context) {
	userID := h.getUserID(c)
	score, err := h.service.GetReadinessScore(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, score)
}

func (h *InterviewPrepHandler) AICoachChat(c *gin.Context) {
	userID := h.getUserID(c)
	var req models.AICoachChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.service.AICoachChat(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, session)
}
