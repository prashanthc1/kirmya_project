package service

import (
	"context"

	"kirmya/internal/workforce_intelligence/domain"
	"kirmya/internal/workforce_intelligence/repository"

	"github.com/google/uuid"
)

type IntelligenceService interface {
	GetMarketInsights(ctx context.Context, industry, region string) ([]domain.MarketInsight, error)
	GetSkillTrends(ctx context.Context) ([]domain.SkillTrend, error)
	GetHiringStatistics(ctx context.Context, region string) ([]domain.HiringStatistic, error)
	GetUserCareerRecommendations(ctx context.Context, userID uuid.UUID) ([]domain.CareerRecommendation, error)
}

type intelligenceService struct {
	repo repository.IntelligenceRepository
}

func NewIntelligenceService(repo repository.IntelligenceRepository) IntelligenceService {
	return &intelligenceService{repo: repo}
}

func (s *intelligenceService) GetMarketInsights(ctx context.Context, industry, region string) ([]domain.MarketInsight, error) {
	return s.repo.GetMarketInsights(ctx, industry, region)
}

func (s *intelligenceService) GetSkillTrends(ctx context.Context) ([]domain.SkillTrend, error) {
	return s.repo.GetSkillTrends(ctx)
}

func (s *intelligenceService) GetHiringStatistics(ctx context.Context, region string) ([]domain.HiringStatistic, error) {
	return s.repo.GetHiringStatistics(ctx, region)
}

func (s *intelligenceService) GetUserCareerRecommendations(ctx context.Context, userID uuid.UUID) ([]domain.CareerRecommendation, error) {
	return []domain.CareerRecommendation{
		{
			RecommendedSkill: "Distributed Transaction Locks (Redis/Raft)",
			MarketDemand:     "96% Surging Demand",
			SalaryBumpEst:    "+24% Base Premium",
			Reason:           "Pairing your 5+ yrs Go experience with Raft consensus architecture unlocks Principal Backend Architect roles.",
			MatchConfidence:  0.94,
		},
		{
			RecommendedSkill: "PostgreSQL GIN & BRIN Index Tuning",
			MarketDemand:     "92% Surging Demand",
			SalaryBumpEst:    "+18% Base Premium",
			Reason:           "High demand in UAE & APAC enterprise financial hubs for high-throughput query optimization.",
			MatchConfidence:  0.91,
		},
	}, nil
}
