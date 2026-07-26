package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	ForecastSurging   = "surging"
	ForecastStable    = "stable"
	ForecastDeclining = "declining"

	CompetitionHigh     = "high"
	CompetitionModerate = "moderate"
	CompetitionLow      = "low"
)

type MarketInsight struct {
	ID                uuid.UUID `json:"id"`
	Industry          string    `json:"industry"`
	Region            string    `json:"region"`
	GrowthRatePct     float64   `json:"growth_rate_pct"`
	AvgSalaryUSD      float64   `json:"avg_salary_usd"`
	ActiveJobPostings int       `json:"active_job_postings"`
	TimePeriod        string    `json:"time_period"`
	CreatedAt         time.Time `json:"created_at"`
}

type SkillTrend struct {
	ID                  uuid.UUID `json:"id"`
	SkillName           string    `json:"skill_name"`
	Category            string    `json:"category"`
	DemandScore         int       `json:"demand_score"` // 0 to 100
	GrowthYoYPct        float64   `json:"growth_yoy_pct"`
	AvgSalaryPremiumPct float64   `json:"avg_salary_premium_pct"`
	ForecastTier        string    `json:"forecast_tier"` // 'surging', 'stable', 'declining'
	UpdatedAt           time.Time `json:"updated_at"`
}

type HiringStatistic struct {
	ID                      uuid.UUID `json:"id"`
	RoleTitle               string    `json:"role_title"`
	Region                  string    `json:"region"`
	TalentAvailabilityCount int       `json:"talent_availability_count"`
	AvgDaysToHire           int       `json:"avg_days_to_hire"`
	CompetitionLevel        string    `json:"competition_level"` // 'high', 'moderate', 'low'
	UpdatedAt               time.Time `json:"updated_at"`
}

type CareerRecommendation struct {
	RecommendedSkill string  `json:"recommended_skill"`
	MarketDemand     string  `json:"market_demand"`
	SalaryBumpEst    string  `json:"salary_bump_est"`
	Reason           string  `json:"reason"`
	MatchConfidence  float64 `json:"match_confidence"`
}
