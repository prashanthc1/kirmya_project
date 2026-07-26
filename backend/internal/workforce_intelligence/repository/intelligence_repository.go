package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/workforce_intelligence/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IntelligenceRepository interface {
	GetMarketInsights(ctx context.Context, industry, region string) ([]domain.MarketInsight, error)
	GetSkillTrends(ctx context.Context) ([]domain.SkillTrend, error)
	GetHiringStatistics(ctx context.Context, region string) ([]domain.HiringStatistic, error)
}

type pgxIntelligenceRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	marketInsights []domain.MarketInsight
	skillTrends    []domain.SkillTrend
	hiringStats    []domain.HiringStatistic
}

func NewIntelligenceRepository(pool *pgxpool.Pool) IntelligenceRepository {
	repo := &pgxIntelligenceRepository{pool: pool}
	repo.seedDefaultData()
	return repo
}

func (r *pgxIntelligenceRepository) seedDefaultData() {
	now := time.Now()

	r.marketInsights = []domain.MarketInsight{
		{
			ID:                uuid.New(),
			Industry:          "Fintech & Payments Architecture",
			Region:            "ME_GCC",
			GrowthRatePct:     28.5,
			AvgSalaryUSD:      185000,
			ActiveJobPostings: 4250,
			TimePeriod:        "Q3 2026",
			CreatedAt:         now,
		},
		{
			ID:                uuid.New(),
			Industry:          "Distributed Systems & Cloud Engineering",
			Region:            "APAC",
			GrowthRatePct:     34.2,
			AvgSalaryUSD:      145000,
			ActiveJobPostings: 8900,
			TimePeriod:        "Q3 2026",
			CreatedAt:         now,
		},
		{
			ID:                uuid.New(),
			Industry:          "AI & Machine Learning Infrastructure",
			Region:            "GLOBAL",
			GrowthRatePct:     45.8,
			AvgSalaryUSD:      210000,
			ActiveJobPostings: 12400,
			TimePeriod:        "Q3 2026",
			CreatedAt:         now,
		},
	}

	r.skillTrends = []domain.SkillTrend{
		{
			ID:                  uuid.New(),
			SkillName:           "Go (Golang) Microservices",
			Category:            "Backend Engineering",
			DemandScore:         96,
			GrowthYoYPct:        42.5,
			AvgSalaryPremiumPct: 24.0,
			ForecastTier:        domain.ForecastSurging,
			UpdatedAt:           now,
		},
		{
			ID:                  uuid.New(),
			SkillName:           "PostgreSQL Performance Optimization",
			Category:            "Database Infrastructure",
			DemandScore:         92,
			GrowthYoYPct:        38.0,
			AvgSalaryPremiumPct: 18.5,
			ForecastTier:        domain.ForecastSurging,
			UpdatedAt:           now,
		},
		{
			ID:                  uuid.New(),
			SkillName:           "Kubernetes & Distributed Systems",
			Category:            "Cloud Infrastructure",
			DemandScore:         89,
			GrowthYoYPct:        29.4,
			AvgSalaryPremiumPct: 22.0,
			ForecastTier:        domain.ForecastSurging,
			UpdatedAt:           now,
		},
		{
			ID:                  uuid.New(),
			SkillName:           "React Native & Cross-Platform Mobile",
			Category:            "Mobile Engineering",
			DemandScore:         86,
			GrowthYoYPct:        25.1,
			AvgSalaryPremiumPct: 16.0,
			ForecastTier:        domain.ForecastStable,
			UpdatedAt:           now,
		},
	}

	r.hiringStats = []domain.HiringStatistic{
		{
			ID:                      uuid.New(),
			RoleTitle:               "Senior Go Backend Architect",
			Region:                  "ME_GCC",
			TalentAvailabilityCount: 1420,
			AvgDaysToHire:           18,
			CompetitionLevel:        domain.CompetitionHigh,
			UpdatedAt:               now,
		},
		{
			ID:                      uuid.New(),
			RoleTitle:               "Lead Cloud Infrastructure Engineer",
			Region:                  "APAC",
			TalentAvailabilityCount: 3850,
			AvgDaysToHire:           22,
			CompetitionLevel:        domain.CompetitionModerate,
			UpdatedAt:               now,
		},
	}
}

func (r *pgxIntelligenceRepository) GetMarketInsights(ctx context.Context, industry, region string) ([]domain.MarketInsight, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.MarketInsight
	for _, m := range r.marketInsights {
		if industry != "" && industry != "ALL" && m.Industry != industry {
			continue
		}
		if region != "" && region != "ALL" && m.Region != region {
			continue
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *pgxIntelligenceRepository) GetSkillTrends(ctx context.Context) ([]domain.SkillTrend, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.skillTrends, nil
}

func (r *pgxIntelligenceRepository) GetHiringStatistics(ctx context.Context, region string) ([]domain.HiringStatistic, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.HiringStatistic
	for _, h := range r.hiringStats {
		if region != "" && region != "ALL" && h.Region != region {
			continue
		}
		list = append(list, h)
	}
	return list, nil
}
