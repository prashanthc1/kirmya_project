package service

import (
	"context"

	"kirmya/internal/landing/domain"
	"kirmya/internal/landing/repository"
)

type LandingService interface {
	GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error)
	CreateTestimonial(ctx context.Context, t *domain.Testimonial) error
	CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error
}

type landingService struct {
	repo repository.LandingRepository
}

func NewLandingService(repo repository.LandingRepository) LandingService {
	return &landingService{repo: repo}
}

func (s *landingService) GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error) {
	return s.repo.GetLandingContent(ctx)
}

func (s *landingService) CreateTestimonial(ctx context.Context, t *domain.Testimonial) error {
	return s.repo.CreateTestimonial(ctx, t)
}

func (s *landingService) CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error {
	return s.repo.CreateFeaturedJob(ctx, j)
}
