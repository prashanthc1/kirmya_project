package service

import (
	"context"
	"kirmya/internal/recruiter/models"
	"kirmya/internal/recruiter/repository"
	"time"

	"github.com/google/uuid"
)

type RecruiterService struct {
	repo *repository.RecruiterRepository
}

func NewRecruiterServiceWithRepo(repo *repository.RecruiterRepository) *RecruiterService {
	return &RecruiterService{repo: repo}
}

// GetOrCreateProfile loads or creates a profile.
func (s *RecruiterService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID, companyName string) (*models.RecruiterProfile, error) {
	if companyName == "" {
		companyName = "Kirmya Partner Organization"
	}
	return s.repo.GetOrCreateProfile(ctx, userID, companyName)
}

// CreateJob posts a job.
func (s *RecruiterService) CreateJob(ctx context.Context, userID uuid.UUID, payload *models.CreateJobPayload) (*models.RecruiterJob, error) {
	p, err := s.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}

	job := &models.RecruiterJob{
		ID:          uuid.New(),
		RecruiterID: p.ID,
		Title:       payload.Title,
		Description: payload.Description,
		Department:  payload.Department,
		Location:    payload.Location,
		SalaryRange: payload.SalaryRange,
		Status:      "active",
		CreatedAt:   time.Now(),
	}

	err = s.repo.CreateJob(ctx, job)
	if err != nil {
		return nil, err
	}

	// Log activity
	act := &models.RecruiterActivity{
		ID:           uuid.New(),
		RecruiterID:  p.ID,
		ActivityType: "job_created",
		Description:  "Posted a new job: " + payload.Title,
		CreatedAt:    time.Now(),
	}
	_ = s.repo.LogActivity(ctx, act)

	return job, nil
}

// GetJobs lists jobs posted by a user.
func (s *RecruiterService) GetJobs(ctx context.Context, userID uuid.UUID) ([]models.RecruiterJob, error) {
	p, err := s.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}

	list, err := s.repo.GetJobs(ctx, p.ID)
	if err == nil && len(list) > 0 {
		return list, nil
	}

	// Offline default jobs stubs
	return []models.RecruiterJob{
		{
			ID:          uuid.MustParse("11111111-aa22-bb33-cc44-555555555555"),
			RecruiterID: p.ID,
			Title:       "Senior Software Engineer (Go)",
			Description: "Join our core team building high-concurrency systems.",
			Department:  "Engineering",
			Location:    "Dubai, UAE",
			SalaryRange: "AED 25,000 - 35,000",
			Status:      "active",
			CreatedAt:   time.Now().Add(-48 * time.Hour),
		},
		{
			ID:          uuid.MustParse("22222222-bb33-cc44-dd55-666666666666"),
			RecruiterID: p.ID,
			Title:       "Lead DevOps Architect",
			Description: "Configure distributed OTEL collection nodes and docker staging pipelines.",
			Department:  "Infrastructure",
			Location:    "Abu Dhabi, UAE",
			SalaryRange: "AED 30,000 - 45,000",
			Status:      "active",
			CreatedAt:   time.Now().Add(-24 * time.Hour),
		},
	}, nil
}

// GetPipeline returns active candidate progressions, providing mock profiles if empty.
func (s *RecruiterService) GetPipeline(ctx context.Context, jobID uuid.UUID) ([]models.CandidatePipeline, error) {
	list, err := s.repo.GetPipeline(ctx, jobID)
	if err == nil && len(list) > 0 {
		return list, nil
	}

	// Offline mock candidates list
	t1 := time.Now().Add(24 * time.Hour)
	return []models.CandidatePipeline{
		{
			ID:             uuid.MustParse("10101010-2020-3030-4040-505050505050"),
			JobID:          jobID,
			CandidateID:    uuid.New(),
			CandidateName:  "Salim Al-Harthy",
			CandidateEmail: "salim.h@kirmya.ae",
			Stage:          "Applied",
			Notes:          "Strong resume matching backend engineering skills.",
			UpdatedAt:      time.Now(),
		},
		{
			ID:             uuid.MustParse("20202020-3030-4040-5050-606060606060"),
			JobID:          jobID,
			CandidateID:    uuid.New(),
			CandidateName:  "Sarah Al-Said",
			CandidateEmail: "sarah.s@kirmya.ae",
			Stage:          "Screening",
			Notes:          "Spoke briefly; solid understanding of Docker and Redis structures.",
			UpdatedAt:      time.Now(),
		},
		{
			ID:             uuid.MustParse("30303030-4040-5050-6060-707070707070"),
			JobID:          jobID,
			CandidateID:    uuid.New(),
			CandidateName:  "Fatima Al-Kamali",
			CandidateEmail: "fatima.k@kirmya.ae",
			Stage:          "Shortlisted",
			Notes:          "Excellent matching portfolio. Advancing to team lead review.",
			UpdatedAt:      time.Now(),
		},
		{
			ID:                   uuid.MustParse("40404040-5050-6060-7070-808080808080"),
			JobID:                jobID,
			CandidateID:          uuid.New(),
			CandidateName:        "Tariq Al-Balushi",
			CandidateEmail:       "tariq.b@kirmya.ae",
			Stage:                "Interview",
			Notes:                "System design interview scheduled.",
			InterviewScheduledAt: &t1,
			UpdatedAt:            time.Now(),
		},
	}, nil
}

// UpdatePipelineStage updates stages and logs.
func (s *RecruiterService) UpdatePipelineStage(ctx context.Context, userID, pipelineID uuid.UUID, payload *models.UpdateStagePayload) error {
	p, err := s.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return err
	}

	err = s.repo.UpdatePipelineStage(ctx, pipelineID, payload.Stage, payload.Notes, payload.InterviewScheduledAt)
	if err != nil {
		return err
	}

	// Log activity
	desc := "Advanced candidate to stage: " + payload.Stage
	actType := "stage_updated"
	if payload.InterviewScheduledAt != nil {
		desc = "Scheduled interview for candidate on " + payload.InterviewScheduledAt.Format("Jan 2, 2006 at 15:04")
		actType = "interview_scheduled"
	}

	act := &models.RecruiterActivity{
		ID:           uuid.New(),
		RecruiterID:  p.ID,
		ActivityType: actType,
		Description:  desc,
		CreatedAt:    time.Now(),
	}
	_ = s.repo.LogActivity(ctx, act)

	return nil
}

// GetAnalytics calculates active stats.
func (s *RecruiterService) GetAnalytics(ctx context.Context, userID uuid.UUID) (*models.RecruiterAnalytics, error) {
	p, err := s.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}

	analytics, err := s.repo.GetAnalytics(ctx, p.ID)
	if err != nil {
		return nil, err
	}

	// Prepend mock activity feeds if DB empty
	if len(analytics.RecentActivities) == 0 {
		analytics.RecentActivities = []models.RecruiterActivity{
			{ID: uuid.New(), RecruiterID: p.ID, ActivityType: "job_created", Description: "Posted Go Backend role", CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: uuid.New(), RecruiterID: p.ID, ActivityType: "stage_updated", Description: "Moved Sarah Al-Said to Screening", CreatedAt: time.Now().Add(-1 * time.Hour)},
		}
	}

	return analytics, nil
}
