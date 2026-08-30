package service

import (
	"context"

	"kirmya/internal/jobs/models"
	"kirmya/internal/jobs/repository"
)

type JobService interface {
	SearchJobs(ctx context.Context, q models.JobSearchQuery) (*models.JobListPage, error)
	GetJobByID(ctx context.Context, id string) (*models.JobDetail, error)
}

type jobService struct {
	repo *repository.JobRepository
}

func NewJobService(repo *repository.JobRepository) JobService {
	return &jobService{repo: repo}
}

func (s *jobService) SearchJobs(ctx context.Context, q models.JobSearchQuery) (*models.JobListPage, error) {
	return s.repo.SearchJobs(ctx, q)
}

func (s *jobService) GetJobByID(ctx context.Context, id string) (*models.JobDetail, error) {
	return s.repo.GetJobByID(ctx, id)
}
