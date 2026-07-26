package service

import (
	"context"

	"kirmya/internal/ai_job_match/domain"
	"kirmya/internal/ai_job_match/repository"
	"kirmya/internal/ai_job_match/scoring"

	"github.com/google/uuid"
)

type MatchingService interface {
	GetUserMatches(ctx context.Context, userID uuid.UUID) ([]domain.AIJobMatch, error)
	GetMatchByID(ctx context.Context, matchID uuid.UUID) (*domain.AIJobMatch, error)
	SubmitFeedback(ctx context.Context, userID uuid.UUID, matchID uuid.UUID, payload domain.SubmitFeedbackPayload) (*domain.MatchingFeedback, error)
	CalculateCandidateJobMatch(ctx context.Context, candidate *domain.CandidateProfile, job *domain.JobRequirement) (*domain.AIJobMatch, error)
}

type matchingService struct {
	repo  repository.MatchingRepository
	model *scoring.MatchingModel
}

func NewMatchingService(repo repository.MatchingRepository, model *scoring.MatchingModel) MatchingService {
	return &matchingService{
		repo:  repo,
		model: model,
	}
}

func (s *matchingService) GetUserMatches(ctx context.Context, userID uuid.UUID) ([]domain.AIJobMatch, error) {
	return s.repo.GetUserMatches(ctx, userID)
}

func (s *matchingService) GetMatchByID(ctx context.Context, matchID uuid.UUID) (*domain.AIJobMatch, error) {
	return s.repo.GetMatchByID(ctx, matchID)
}

func (s *matchingService) SubmitFeedback(ctx context.Context, userID uuid.UUID, matchID uuid.UUID, payload domain.SubmitFeedbackPayload) (*domain.MatchingFeedback, error) {
	fb := &domain.MatchingFeedback{
		ID:           uuid.New(),
		MatchID:      matchID,
		UserID:       userID,
		FeedbackType: payload.FeedbackType,
		Notes:        payload.Notes,
	}

	if err := s.repo.SaveFeedback(ctx, fb); err != nil {
		return nil, err
	}
	return fb, nil
}

func (s *matchingService) CalculateCandidateJobMatch(ctx context.Context, candidate *domain.CandidateProfile, job *domain.JobRequirement) (*domain.AIJobMatch, error) {
	match, breakdown := s.model.CalculateMatchScore(candidate, job)
	match.UserID = candidate.UserID

	if err := s.repo.SaveMatch(ctx, match, breakdown); err != nil {
		return nil, err
	}
	return match, nil
}
