package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.RouterGroup, handler *InterviewPrepHandler) {
	prepGroup := r.Group("/interview-prep")
	{
		// Workspace CRUD
		prepGroup.POST("", handler.CreatePreparation)
		prepGroup.GET("", handler.ListPreparations)
		prepGroup.GET("/:id", handler.GetPreparation)
		prepGroup.PUT("/:id", handler.UpdatePreparation)
		prepGroup.DELETE("/:id", handler.DeletePreparation)

		// Question Library & AI Question Generation
		prepGroup.POST("/questions/generate", handler.GenerateQuestions)
		prepGroup.GET("/questions", handler.ListQuestions)
		prepGroup.POST("/questions", handler.SaveQuestion)
		prepGroup.PUT("/questions/:id", handler.UpdateQuestionPractice)
		prepGroup.DELETE("/questions/:id", handler.DeleteQuestion)

		// Mock Interview Sessions
		prepGroup.POST("/mock/sessions", handler.StartMockSession)
		prepGroup.GET("/mock/sessions", handler.ListMockSessions)
		prepGroup.GET("/mock/sessions/:id", handler.GetMockSession)
		prepGroup.POST("/mock/sessions/:id/submit", handler.SubmitMockAnswer)
		prepGroup.POST("/mock/sessions/:id/complete", handler.CompleteMockSession)

		// Tasks & Checklists
		prepGroup.POST("/tasks", handler.CreateTask)
		prepGroup.GET("/tasks", handler.ListTasks)
		prepGroup.PUT("/tasks/:id", handler.ToggleTaskCompletion)
		prepGroup.DELETE("/tasks/:id", handler.DeleteTask)

		// Notes & Debrief & Readiness Scores & AI Coach
		prepGroup.POST("/notes", handler.SaveNote)
		prepGroup.GET("/notes", handler.GetNote)
		prepGroup.GET("/readiness", handler.GetReadinessScore)
		prepGroup.POST("/coach/chat", handler.AICoachChat)
	}
}
