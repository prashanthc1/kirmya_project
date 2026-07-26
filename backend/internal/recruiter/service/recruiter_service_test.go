package service

import (
	"context"
	"kirmya/internal/recruiter/models"
	"kirmya/internal/recruiter/repository"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestCreateJobFlow(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterServiceWithRepo(repo)

	userID := uuid.New()
	payload := &models.CreateJobPayload{
		Title:       "Staff Engineer (Go)",
		Description: "Design structured slog and redis abstractions.",
		Department:  "Infrastructure",
		Location:    "Dubai, UAE",
		SalaryRange: "AED 30,000 - 40,000",
	}

	job, err := svc.CreateJob(context.Background(), userID, payload)
	if err != nil {
		t.Fatalf("Expected no error creating job, got %v", err)
	}

	if job.Title != "Staff Engineer (Go)" {
		t.Errorf("Expected job title 'Staff Engineer (Go)', got %s", job.Title)
	}

	if job.Status != "active" {
		t.Errorf("Expected job status 'active', got %s", job.Status)
	}
}

func TestPipelineStubsGeneration(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterServiceWithRepo(repo)

	jobID := uuid.New()

	pipeline, err := svc.GetPipeline(context.Background(), jobID)
	if err != nil {
		t.Fatalf("Expected no error fetching pipeline, got %v", err)
	}

	// Should generate 4 stubs automatically
	if len(pipeline) != 4 {
		t.Errorf("Expected exactly 4 mock pipeline records, got %d", len(pipeline))
	}

	if pipeline[0].CandidateName != "Salim Al-Harthy" {
		t.Errorf("Expected first mock candidate to be 'Salim Al-Harthy', got %s", pipeline[0].CandidateName)
	}
}

func TestUpdatePipelineStageFlow(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterServiceWithRepo(repo)

	userID := uuid.New()
	pipelineID := uuid.New()
	scheduledTime := time.Now().Add(48 * time.Hour)

	payload := &models.UpdateStagePayload{
		Stage:                "Interview",
		Notes:                "Advancing candidate to system design interview.",
		InterviewScheduledAt: &scheduledTime,
	}

	err := svc.UpdatePipelineStage(context.Background(), userID, pipelineID, payload)
	if err != nil {
		t.Fatalf("Expected no error updating stage, got %v", err)
	}
}

func TestGetAnalyticsStubs(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterServiceWithRepo(repo)

	userID := uuid.New()

	analytics, err := svc.GetAnalytics(context.Background(), userID)
	if err != nil {
		t.Fatalf("Expected no error fetching analytics, got %v", err)
	}

	if analytics.TotalJobsActive != 3 {
		t.Errorf("Expected default active jobs count to be 3, got %d", analytics.TotalJobsActive)
	}

	if analytics.TotalCandidatesCount != 14 {
		t.Errorf("Expected default candidate count to be 14, got %d", analytics.TotalCandidatesCount)
	}
}
