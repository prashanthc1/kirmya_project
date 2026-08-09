package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/interview_prep/models"
	"kirmya/internal/interview_prep/repository"
	"kirmya/internal/interview_prep/service"
)

func TestInterviewPrepService_WorkspaceAndFlow(t *testing.T) {
	repo := repository.NewPostgresRepository(nil)
	svc := service.NewInterviewPrepService(repo)
	ctx := context.Background()
	userID := uuid.New()

	// 1. Create Preparation Workspace
	prep, err := svc.CreatePreparation(ctx, userID, models.CreatePreparationRequest{
		CompanyName:         "Google",
		JobTitle:            "Staff Software Engineer",
		InterviewType:       "Behavioral",
		InterviewRound:      "Technical Onsite",
		ExperienceLevel:     "Senior",
		PreparationDuration: "7 Days",
	})
	if err != nil {
		t.Fatalf("Failed to create preparation workspace: %v", err)
	}

	if prep.CompanyName != "Google" || prep.ReadinessScore < 50 {
		t.Errorf("Unexpected preparation details: %+v", prep)
	}

	// 2. Generate AI Questions
	questions, err := svc.GenerateQuestions(ctx, userID, models.GenerateQuestionsRequest{
		PreparationID: &prep.ID,
		JobTitle:      "Staff Software Engineer",
		CompanyName:   "Google",
		Category:      "Behavioral",
		Count:         3,
	})
	if err != nil {
		t.Fatalf("Failed to generate questions: %v", err)
	}
	if len(questions) == 0 {
		t.Errorf("Expected generated questions, got empty list")
	}

	// 3. Practice a Question with STAR Framework
	qID := questions[0].ID
	updatedQ, err := svc.UpdateQuestionPractice(ctx, qID, models.UpdateQuestionPracticeRequest{
		UserAnswer:    "I led a project to migrate our microservices to Google Cloud Engine. Situation: monolithic latency bottleneck. Task: migrate without downtime. Action: zero-downtime blue/green deployment strategy. Result: 40% performance gain.",
		STARSituation: "Monolithic latency bottleneck",
		STARTask:      "Migrate to GCP with zero downtime",
		STARAction:    "Implemented blue/green deployment",
		STARResult:    "40% performance gain",
		IsPracticed:   true,
	})
	if err != nil {
		t.Fatalf("Failed to practice question: %v", err)
	}
	if !updatedQ.IsPracticed {
		t.Errorf("Expected question to be marked as practiced")
	}

	// 4. Start AI Mock Interview Session
	mockSession, err := svc.StartMockSession(ctx, userID, models.StartMockSessionRequest{
		PreparationID: &prep.ID,
		Title:         "Google Staff Prep Mock",
		InterviewType: "Behavioral",
		TotalQuestions: 2,
	})
	if err != nil {
		t.Fatalf("Failed to start mock session: %v", err)
	}

	// 5. Submit Mock Answer
	ans, err := svc.SubmitMockAnswer(ctx, mockSession.ID, models.SubmitMockAnswerRequest{
		QuestionText:    "Tell me about a time you resolved a major technical outage under intense pressure.",
		CandidateAnswer: "Situation: At my previous company, a database lock caused a system outage. Task: Resolve the lock and restore service within 15 minutes. Action: I analyzed active queries, killed the blocking transaction, and refactored the connection pool configuration. Result: System restored in 8 minutes with zero data loss.",
	})
	if err != nil {
		t.Fatalf("Failed to submit mock answer: %v", err)
	}
	if ans.OverallScore <= 0 || !ans.HasSTARSituation || !ans.HasSTARResult {
		t.Errorf("Expected high STAR evaluation score, got score=%d, S=%v, R=%v", ans.OverallScore, ans.HasSTARSituation, ans.HasSTARResult)
	}

	// 6. Complete Session & Check Readiness
	completedSession, err := svc.CompleteMockSession(ctx, mockSession.ID)
	if err != nil {
		t.Fatalf("Failed to complete mock session: %v", err)
	}
	if completedSession.Status != "Completed" {
		t.Errorf("Expected completed status, got %s", completedSession.Status)
	}

	readiness, err := svc.GetReadinessScore(ctx, userID)
	if err != nil {
		t.Fatalf("Failed to get readiness score: %v", err)
	}
	if readiness.OverallReadiness <= 0 {
		t.Errorf("Expected valid overall readiness score, got %d", readiness.OverallReadiness)
	}

	// 7. Post-Interview Debrief Note & Thank-You Draft Generation
	note, err := svc.SaveNote(ctx, userID, models.SaveInterviewNoteRequest{
		PreparationID:        prep.ID,
		Interviewers:         "Sarah Connor (Engineering Director)",
		TopicsDiscussed:      "System scalability, distributed consensus, team culture",
		QuestionsAsked:       "System design for distributed key-value store",
		CandidatePerformance: "Strong technical answers and clear communication",
		OverallFeeling:       "Excellent",
		GenerateThankYou:     true,
	})
	if err != nil {
		t.Fatalf("Failed to save interview note: %v", err)
	}
	if note.ThankYouDraft == "" {
		t.Errorf("Expected generated thank-you draft, got empty string")
	}

	// 8. AI Coach Chat Session
	coachSession, err := svc.AICoachChat(ctx, userID, models.AICoachChatRequest{
		Topic:   "Salary Negotiation",
		Message: "How do I negotiate a higher base salary for a Staff Engineer role at Google?",
	})
	if err != nil {
		t.Fatalf("Failed AI Coach Chat: %v", err)
	}
	if len(coachSession.Messages) != 2 {
		t.Errorf("Expected 2 messages (user + ai), got %d", len(coachSession.Messages))
	}
}

func TestInterviewPrepService_Tasks(t *testing.T) {
	repo := repository.NewPostgresRepository(nil)
	svc := service.NewInterviewPrepService(repo)
	ctx := context.Background()
	prepID := uuid.New()

	dueDate := time.Now().Add(24 * time.Hour)
	task, err := svc.CreateTask(ctx, prepID, models.CreateTaskRequest{
		PreparationID: prepID,
		Title:         "Read Google Engineering Blog",
		Category:      "Research",
		DueDate:       &dueDate,
	})
	if err != nil {
		t.Fatalf("Failed to create task: %v", err)
	}

	tasks, err := svc.ListTasks(ctx, prepID)
	if err != nil || len(tasks) == 0 {
		t.Fatalf("Failed to list tasks: %v", err)
	}

	if err := svc.ToggleTaskCompletion(ctx, task.ID, true); err != nil {
		t.Fatalf("Failed to toggle task completion: %v", err)
	}

	if err := svc.DeleteTask(ctx, task.ID); err != nil {
		t.Fatalf("Failed to delete task: %v", err)
	}
}
