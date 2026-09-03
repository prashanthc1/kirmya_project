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

	// 1. Get Applications
	apps, err := svc.GetCandidateApplications(ctx, candidateID, "", "")
	if err != nil {
		t.Fatalf("GetCandidateApplications failed: %v", err)
	}
	if len(apps) == 0 {
		t.Error("Expected applications list")
	}

	// 2. Get Application By ID
	appDetail, err := svc.GetApplicationByID(ctx, candidateID, apps[0].ID)
	if err != nil {
		t.Fatalf("GetApplicationByID failed: %v", err)
	}
	if appDetail == nil {
		t.Fatal("Expected application detail")
	}

	// 3. Withdraw Application
	err = svc.WithdrawApplication(ctx, candidateID, apps[0].ID)
	if err != nil {
		t.Fatalf("WithdrawApplication failed: %v", err)
	}

	// 4. Saved Jobs
	jobID := uuid.New()
	err = svc.SaveJob(ctx, candidateID, jobID, "Must apply soon")
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
	err = svc.RemoveSavedJob(ctx, candidateID, jobID)
	if err != nil {
		t.Fatalf("RemoveSavedJob failed: %v", err)
	}

	// 5. Job Alerts
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

	alerts, err := svc.GetJobAlerts(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetJobAlerts failed: %v", err)
	}
	if len(alerts) == 0 {
		t.Error("Expected job alerts")
	}

	err = svc.DeleteJobAlert(ctx, candidateID, alert.ID)
	if err != nil {
		t.Fatalf("DeleteJobAlert failed: %v", err)
	}

	// 6. Interviews & Documents
	interviews, err := svc.GetCandidateInterviews(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetCandidateInterviews failed: %v", err)
	}
	if len(interviews) == 0 {
		t.Error("Expected candidate interviews")
	}

	docs, err := svc.GetCandidateDocuments(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetCandidateDocuments failed: %v", err)
	}
	if len(docs) == 0 {
		t.Error("Expected candidate documents")
	}

	// 7. Stats & AI Insights
	stats, err := svc.GetApplicationStats(ctx, candidateID)
	if err != nil {
		t.Fatalf("GetApplicationStats failed: %v", err)
	}
	if stats.TotalApplications == 0 {
		t.Error("Expected non-zero total applications")
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
}
