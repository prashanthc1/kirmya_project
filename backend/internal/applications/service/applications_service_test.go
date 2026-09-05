package service

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"kirmya/internal/applications/models"
	"kirmya/internal/applications/repository"
)

func TestApplicationsService_FullWorkflow(t *testing.T) {
	repo := repository.NewApplicationsRepository(nil)
	svc := NewApplicationsService(repo)
	ctx := context.Background()
	candidateID := uuid.New()
	jobID := uuid.New()
	resumeID := uuid.New()

	// 1. Create Application
	createdApp, err := svc.CreateApplication(ctx, candidateID, models.CreateApplicationPayload{
		JobID:       jobID,
		ResumeID:    &resumeID,
		CoverLetter: "Initial application for full workflow test",
	})
	if err != nil {
		t.Fatalf("CreateApplication failed: %v", err)
	}
	if createdApp == nil {
		t.Fatal("Expected created application")
	}

	// 2. Get Applications
	apps, err := svc.GetCandidateApplications(ctx, candidateID, "", "")
	if err != nil {
		t.Fatalf("GetCandidateApplications failed: %v", err)
	}
	if len(apps) == 0 {
		t.Error("Expected applications list")
	}

	// 3. Get Application By ID
	appDetail, err := svc.GetApplicationByID(ctx, candidateID, createdApp.Summary.ID)
	if err != nil {
		t.Fatalf("GetApplicationByID failed: %v", err)
	}
	if appDetail == nil {
		t.Fatal("Expected application detail")
	}

	// 4. Withdraw Application
	err = svc.WithdrawApplication(ctx, candidateID, createdApp.Summary.ID)
	if err != nil {
		t.Fatalf("WithdrawApplication failed: %v", err)
	}

	// 5. Saved Jobs
	savedJobID := uuid.New()
	err = svc.SaveJob(ctx, candidateID, savedJobID, "Must apply soon")
	if err != nil {
		t.Fatalf("SaveJob failed: %v", err)
	}
	savedJobs, err := svc.GetSavedJobs(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetSavedJobs failed: %v", err)
	}
	if len(savedJobs) == 0 {
		t.Error("Expected saved jobs list")
	}
	err = svc.RemoveSavedJob(ctx, candidateID, savedJobID)
	if err != nil {
		t.Fatalf("RemoveSavedJob failed: %v", err)
	}

	// 6. Job Alerts
	alertPayload := models.CreateJobAlertPayload{
		Title:        "Go Microservices Alert",
		Keywords:     "Golang PostgreSQL Gin",
		JobTitles:    []string{"Senior Go Engineer"},
		Skills:       []string{"Go", "PostgreSQL"},
		Location:     "Remote",
		Frequency:    "Daily",
		ChannelEmail: true,
	}
	alert, err := svc.CreateJobAlert(ctx, candidateID, alertPayload)
	if err != nil {
		t.Fatalf("CreateJobAlert failed: %v", err)
	}
	if alert.Title != "Go Microservices Alert" {
		t.Errorf("Expected alert title match, got %s", alert.Title)
	}

	// 7. Interviews & Documents
	_, err = svc.GetCandidateInterviews(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetCandidateInterviews failed: %v", err)
	}

	_, err = svc.GetCandidateDocuments(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetCandidateDocuments failed: %v", err)
	}

	// 8. Stats & AI Insights
	stats, err := svc.GetApplicationStats(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetApplicationStats failed: %v", err)
	}
	if stats.TotalApplications == 0 {
		t.Error("Expected non-zero total applications after create")
	}

	insights, err := svc.GetAIInsights(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetAIInsights failed: %v", err)
	}
	if insights.ProfileMatchScore == 0 {
		t.Error("Expected profile match score")
	}

	analytics, err := svc.GetCareerAnalytics(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetCareerAnalytics failed: %v", err)
	}
	if analytics.ApplicationsSent == 0 {
		t.Error("Expected applications sent count")
	}
}

func TestApplicationsService_CreateApplication(t *testing.T) {
	repo := repository.NewApplicationsRepository(nil)
	svc := NewApplicationsService(repo)
	ctx := context.Background()
	candidateID := uuid.New()
	jobID := uuid.New()
	resumeID := uuid.New()

	payload := models.CreateApplicationPayload{
		JobID:       jobID,
		ResumeID:    &resumeID,
		CoverLetter: "I am excited to apply for this role.",
	}

	detail, err := svc.CreateApplication(ctx, candidateID, payload)
	if err != nil {
		t.Fatalf("CreateApplication failed: %v", err)
	}
	if detail == nil {
		t.Fatal("Expected created application detail")
	}
	if detail.Summary.JobID != jobID {
		t.Errorf("Expected job ID %s, got %s", jobID, detail.Summary.JobID)
	}
	if detail.Summary.StatusExplanation == "" {
		t.Error("Expected non-empty status explanation")
	}

	// Duplicate application check
	_, err = svc.CreateApplication(ctx, candidateID, payload)
	if err == nil {
		t.Error("Expected duplicate application error")
	}

	// Idempotency check with distinct key
	payloadWithIdempotency := models.CreateApplicationPayload{
		JobID:          uuid.New(),
		ResumeID:       &resumeID,
		CoverLetter:    "Testing idempotency",
		IdempotencyKey: "test-idem-key-1",
	}
	app1, err := svc.CreateApplication(ctx, candidateID, payloadWithIdempotency)
	if err != nil {
		t.Fatalf("First idempotent apply failed: %v", err)
	}
	app2, err := svc.CreateApplication(ctx, candidateID, payloadWithIdempotency)
	if err != nil {
		t.Fatalf("Second idempotent apply failed: %v", err)
	}
	if app1.Summary.ID != app2.Summary.ID {
		t.Errorf("Expected identical application ID for idempotent key, got %s vs %s", app1.Summary.ID, app2.Summary.ID)
	}
}

func TestApplications_StateMachineTransitions(t *testing.T) {
	// Candidate valid transitions
	if err := models.ValidateTransition(models.StageDraft, models.StageApplied, true); err != nil {
		t.Errorf("Draft -> Applied should be valid for candidate: %v", err)
	}
	if err := models.ValidateTransition(models.StageApplied, models.StageWithdrawn, true); err != nil {
		t.Errorf("Applied -> Withdrawn should be valid for candidate: %v", err)
	}
	if err := models.ValidateTransition(models.StageOffer, models.StageAccepted, true); err != nil {
		t.Errorf("Offer -> Accepted should be valid for candidate: %v", err)
	}

	// Candidate invalid transitions
	if err := models.ValidateTransition(models.StageApplied, models.StageInterview, true); err == nil {
		t.Error("Applied -> Interview should fail for candidate")
	}
	if err := models.ValidateTransition(models.StageApplied, models.StageOffer, true); err == nil {
		t.Error("Applied -> Offer should fail for candidate")
	}

	// Recruiter valid transitions
	if err := models.ValidateTransition(models.StageApplied, models.StageViewed, false); err != nil {
		t.Errorf("Applied -> Viewed should be valid for recruiter: %v", err)
	}
	if err := models.ValidateTransition(models.StageViewed, models.StageShortlisted, false); err != nil {
		t.Errorf("Viewed -> Shortlisted should be valid for recruiter: %v", err)
	}
	if err := models.ValidateTransition(models.StageShortlisted, models.StageInterview, false); err != nil {
		t.Errorf("Shortlisted -> Interview should be valid for recruiter: %v", err)
	}
	if err := models.ValidateTransition(models.StageInterview, models.StageOffer, false); err != nil {
		t.Errorf("Interview -> Offer should be valid for recruiter: %v", err)
	}
	if err := models.ValidateTransition(models.StageOffer, models.StageRejected, false); err != nil {
		t.Errorf("Offer -> Rejected should be valid for recruiter: %v", err)
	}

	// Terminal state restrictions
	if err := models.ValidateTransition(models.StageWithdrawn, models.StageInterview, false); err == nil {
		t.Error("Withdrawn -> Interview should fail (terminal state)")
	}
	if err := models.ValidateTransition(models.StageRejected, models.StageOffer, false); err == nil {
		t.Error("Rejected -> Offer should fail (terminal state)")
	}
	if err := models.ValidateTransition(models.StageRejected, models.StageArchived, false); err != nil {
		t.Errorf("Rejected -> Archived should be allowed: %v", err)
	}
}

func TestApplicationsService_SavedJobsAndArchive(t *testing.T) {
	repo := repository.NewApplicationsRepository(nil)
	svc := NewApplicationsService(repo)
	ctx := context.Background()
	candidateID := uuid.New()
	jobID := uuid.New()

	// Initially not saved
	isSaved, err := svc.IsJobSaved(ctx, candidateID, jobID)
	if err != nil {
		t.Fatalf("IsJobSaved failed: %v", err)
	}
	if isSaved {
		t.Error("Job should not be saved initially")
	}

	// Save job
	if err := svc.SaveJob(ctx, candidateID, jobID, "Dream company"); err != nil {
		t.Fatalf("SaveJob failed: %v", err)
	}

	// Check state
	isSaved, err = svc.IsJobSaved(ctx, candidateID, jobID)
	if err != nil {
		t.Fatalf("IsJobSaved failed: %v", err)
	}
	if !isSaved {
		t.Error("Job should be reported as saved")
	}

	// Archive application
	app, err := svc.CreateApplication(ctx, candidateID, models.CreateApplicationPayload{
		JobID: jobID,
	})
	if err != nil {
		t.Fatalf("CreateApplication before archive failed: %v", err)
	}
	if err := svc.ArchiveApplication(ctx, candidateID, app.Summary.ID); err != nil {
		t.Fatalf("ArchiveApplication failed: %v", err)
	}
}

