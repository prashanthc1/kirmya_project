package service

import (
	"context"
	"time"

	"kirmya/internal/recommendation_engine/domain"
	"kirmya/internal/recommendation_engine/repository"

	"github.com/google/uuid"
)

type RecommendationService interface {
	GetUnifiedRecommendations(ctx context.Context, userID uuid.UUID) (*domain.UnifiedRecommendationsResponse, error)
	TrackEvent(ctx context.Context, userID uuid.UUID, payload domain.TrackEventPayload) error
	GetUserPreferences(ctx context.Context, userID uuid.UUID) (*domain.UserPreference, error)
	UpdatePreferences(ctx context.Context, userID uuid.UUID, payload domain.UpdatePreferencesPayload) error
	GetActiveConfig(ctx context.Context) (*domain.RecommendationConfig, error)
	UpdateActiveConfig(ctx context.Context, cfg *domain.RecommendationConfig) error
	GetDailyMetrics(ctx context.Context) ([]domain.RecommendationMetricsDaily, error)
	GetCareerGapAnalysis(ctx context.Context, userID uuid.UUID) (*domain.CareerGapAnalysis, error)
}

type recommendationService struct {
	repo repository.RecommendationRepository
}

func NewRecommendationService(repo repository.RecommendationRepository) RecommendationService {
	return &recommendationService{repo: repo}
}

func (s *recommendationService) GetUnifiedRecommendations(ctx context.Context, userID uuid.UUID) (*domain.UnifiedRecommendationsResponse, error) {
	pref, _ := s.repo.GetUserPreferences(ctx, userID)
	_ = pref

	jobs, _ := s.repo.GetCandidatesByDomain(ctx, domain.ItemTypeJob)
	people, _ := s.repo.GetCandidatesByDomain(ctx, domain.ItemTypePerson)
	communities, _ := s.repo.GetCandidatesByDomain(ctx, domain.ItemTypeCommunity)
	courses, _ := s.repo.GetCandidatesByDomain(ctx, domain.ItemTypeCourse)
	events, _ := s.repo.GetCandidatesByDomain(ctx, domain.ItemTypeEvent)
	candidates, _ := s.repo.GetCandidatesByDomain(ctx, domain.ItemTypeCandidate)
	talentPools, _ := s.repo.GetCandidatesByDomain(ctx, domain.ItemTypeTalentPool)

	return &domain.UnifiedRecommendationsResponse{
		Jobs:        jobs,
		People:      people,
		Communities: communities,
		Courses:     courses,
		Events:      events,
		Candidates:  candidates,
		TalentPools: talentPools,
	}, nil
}

func (s *recommendationService) TrackEvent(ctx context.Context, userID uuid.UUID, payload domain.TrackEventPayload) error {
	evt := &domain.Event{
		ID:        uuid.New(),
		UserID:    userID,
		ItemType:  payload.ItemType,
		ItemID:    payload.ItemID,
		Action:    payload.Action,
		Context:   map[string]interface{}{"source": "recommendation_studio"},
		CreatedAt: time.Now(),
	}

	if err := s.repo.TrackEvent(ctx, evt); err != nil {
		return err
	}

	// Feedback Loop: Update feature vector on 'dismiss' or 'save'
	if payload.Action == domain.ActionDismiss || payload.Action == domain.ActionSave {
		pref, err := s.repo.GetUserPreferences(ctx, userID)
		if err == nil {
			if payload.Action == domain.ActionDismiss {
				pref.DislikedItems = append(pref.DislikedItems, payload.ItemID.String())
			}
			_ = s.repo.SaveUserPreferences(ctx, pref)
		}
	}

	return nil
}

func (s *recommendationService) GetUserPreferences(ctx context.Context, userID uuid.UUID) (*domain.UserPreference, error) {
	return s.repo.GetUserPreferences(ctx, userID)
}

func (s *recommendationService) UpdatePreferences(ctx context.Context, userID uuid.UUID, payload domain.UpdatePreferencesPayload) error {
	pref, err := s.repo.GetUserPreferences(ctx, userID)
	if err != nil {
		pref = &domain.UserPreference{ID: uuid.New(), UserID: userID}
	}

	if len(payload.PreferredSkills) > 0 {
		pref.PreferredSkills = payload.PreferredSkills
	}
	if len(payload.PreferredLocations) > 0 {
		pref.PreferredLocations = payload.PreferredLocations
	}

	return s.repo.SaveUserPreferences(ctx, pref)
}

func (s *recommendationService) GetActiveConfig(ctx context.Context) (*domain.RecommendationConfig, error) {
	return s.repo.GetActiveConfig(ctx)
}

func (s *recommendationService) UpdateActiveConfig(ctx context.Context, cfg *domain.RecommendationConfig) error {
	return s.repo.UpdateActiveConfig(ctx, cfg)
}

func (s *recommendationService) GetDailyMetrics(ctx context.Context) ([]domain.RecommendationMetricsDaily, error) {
	return s.repo.GetDailyMetrics(ctx)
}

func (s *recommendationService) GetCareerGapAnalysis(ctx context.Context, userID uuid.UUID) (*domain.CareerGapAnalysis, error) {
	return s.repo.GetCareerGapAnalysis(ctx, userID)
}

