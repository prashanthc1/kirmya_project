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
			Industry:          "Artificial Intelligence & ML Engineering",
			Region:            "GLOBAL",
			GrowthRatePct:     48.9,
			AvgSalaryUSD:      210000,
			ActiveJobPostings: 12400,
			TimePeriod:        "Q3 2026",
			CreatedAt:         now,
		},
	}

	r.skillTrends = []domain.SkillTrend{
		{
			ID:                   uuid.New(),
			SkillName:            "Go (Golang)",
			Category:             "Backend Systems",
			DemandScore:          98,
			GrowthYoYPct:         38.5,
			AvgSalaryPremiumPct:  24.0,
			ForecastTier:         domain.ForecastSurging,
			UpdatedAt:            now,
		},
		{
			ID:                   uuid.New(),
			SkillName:            "PostgreSQL & pgxpool Tuning",
			Category:             "Database Engineering",
			DemandScore:          95,
			GrowthYoYPct:         29.0,
			AvgSalaryPremiumPct:  19.5,
			ForecastTier:         domain.ForecastSurging,
			UpdatedAt:            now,
		},
		{
			ID:                   uuid.New(),
			SkillName:            "Next.js & MUI v6 Glassmorphism",
			Category:             "Frontend Development",
			DemandScore:          92,
			GrowthYoYPct:         26.2,
			AvgSalaryPremiumPct:  17.0,
			ForecastTier:         domain.ForecastSurging,
			UpdatedAt:            now,
		},
	}

	r.hiringStats = []domain.HiringStatistic{
		{
			ID:                      uuid.New(),
			RoleTitle:               "Senior Staff Go Engineer",
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
	if r.pool != nil {
		query := `SELECT id, industry, region, growth_rate_pct, avg_salary_usd, active_job_postings, time_period, created_at 
		          FROM market_insights 
		          WHERE ($1 = '' OR $1 = 'ALL' OR industry = $1) AND ($2 = '' OR $2 = 'ALL' OR region = $2) 
		          ORDER BY growth_rate_pct DESC`
		rows, err := r.pool.Query(ctx, query, industry, region)
		if err == nil {
			defer rows.Close()
			var list []domain.MarketInsight
			for rows.Next() {
				var m domain.MarketInsight
				if err := rows.Scan(&m.ID, &m.Industry, &m.Region, &m.GrowthRatePct, &m.AvgSalaryUSD, &m.ActiveJobPostings, &m.TimePeriod, &m.CreatedAt); err == nil {
					list = append(list, m)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
	if r.pool != nil {
		query := `SELECT id, skill_name, category, demand_score, growth_yoy_pct, avg_salary_premium_pct, forecast_tier, updated_at FROM skill_trends ORDER BY demand_score DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.SkillTrend
			for rows.Next() {
				var s domain.SkillTrend
				if err := rows.Scan(&s.ID, &s.SkillName, &s.Category, &s.DemandScore, &s.GrowthYoYPct, &s.AvgSalaryPremiumPct, &s.ForecastTier, &s.UpdatedAt); err == nil {
					list = append(list, s)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.skillTrends, nil
}

func (r *pgxIntelligenceRepository) GetHiringStatistics(ctx context.Context, region string) ([]domain.HiringStatistic, error) {
	if r.pool != nil {
		query := `SELECT id, role_title, region, talent_availability_count, avg_days_to_hire, competition_level, updated_at FROM hiring_statistics WHERE ($1 = '' OR $1 = 'ALL' OR region = $1)`
		rows, err := r.pool.Query(ctx, query, region)
		if err == nil {
			defer rows.Close()
			var list []domain.HiringStatistic
			for rows.Next() {
				var h domain.HiringStatistic
				if err := rows.Scan(&h.ID, &h.RoleTitle, &h.Region, &h.TalentAvailabilityCount, &h.AvgDaysToHire, &h.CompetitionLevel, &h.UpdatedAt); err == nil {
					list = append(list, h)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
