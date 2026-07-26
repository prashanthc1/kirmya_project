package service

import (
	"context"
	"time"

	"kirmya/internal/landing/domain"
	"kirmya/internal/landing/repository"
	"kirmya/internal/shared/cache"
)

type LandingService interface {
	GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error)
	CreateTestimonial(ctx context.Context, t *domain.Testimonial) error
	CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error
}

type landingService struct {
	repo  repository.LandingRepository
	cache cache.MultiTierCache
}

func NewLandingService(repo repository.LandingRepository, c cache.Cache) LandingService {
	var multiCache cache.MultiTierCache
	if c != nil {
		multiCache = cache.NewMultiTierCache(c)
	}
	return &landingService{
		repo:  repo,
		cache: multiCache,
	}
}

func (s *landingService) GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error) {
	if s.cache == nil {
		return s.repo.GetLandingContent(ctx)
	}

	key := cache.LandingContentKey()
	var resp domain.LandingContentResponse

	err := s.cache.GetOrFetch(ctx, key, 30*time.Minute, func() (interface{}, error) {
		return s.repo.GetLandingContent(ctx)
	}, &resp)

	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (s *landingService) CreateTestimonial(ctx context.Context, t *domain.Testimonial) error {
	err := s.repo.CreateTestimonial(ctx, t)
	if err == nil && s.cache != nil {
		_ = s.cache.InvalidateKey(ctx, cache.LandingContentKey())
		_ = s.cache.InvalidateKey(ctx, cache.LandingTestimonialsKey())
	}
	return err
}

func (s *landingService) CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error {
	err := s.repo.CreateFeaturedJob(ctx, j)
	if err == nil && s.cache != nil {
		_ = s.cache.InvalidateKey(ctx, cache.LandingContentKey())
		_ = s.cache.InvalidateKey(ctx, cache.LandingFeaturedJobsKey())
	}
	return err
}
