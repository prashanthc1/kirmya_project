package service

import (
	"context"

	"kirmya/internal/analytics/domain"
	"kirmya/internal/analytics/repository"

	"github.com/google/uuid"
)

type AnalyticsService interface {
	TrackEvent(ctx context.Context, tenantID, userID uuid.UUID, payload domain.TrackEventPayload) error
	GetAdminAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.AdminAnalytics, error)
	GetRecruiterAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.RecruiterAnalytics, error)
	GetUserAnalytics(ctx context.Context, tenantID, userID uuid.UUID) (*domain.UserAnalytics, error)
}

type analyticsService struct {
	repo repository.AnalyticsRepository
}

func NewAnalyticsService(repo repository.AnalyticsRepository) AnalyticsService {
	return &analyticsService{repo: repo}
}

func (s *analyticsService) TrackEvent(ctx context.Context, tenantID, userID uuid.UUID, payload domain.TrackEventPayload) error {
	event := &domain.AnalyticsEvent{
		ID:         uuid.New(),
		TenantID:   tenantID,
		UserID:     userID,
		EventName:  payload.EventName,
		EntityID:   payload.EntityID,
		Properties: payload.Properties,
	}
	return s.repo.TrackEvent(ctx, event)
}

func (s *analyticsService) GetAdminAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.AdminAnalytics, error) {
	return s.repo.GetAdminAnalytics(ctx, tenantID)
}

func (s *analyticsService) GetRecruiterAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.RecruiterAnalytics, error) {
	return s.repo.GetRecruiterAnalytics(ctx, tenantID)
}

func (s *analyticsService) GetUserAnalytics(ctx context.Context, tenantID, userID uuid.UUID) (*domain.UserAnalytics, error) {
	return s.repo.GetUserAnalytics(ctx, tenantID, userID)
}
