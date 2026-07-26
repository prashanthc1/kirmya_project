export interface MarketInsight {
  id: string;
  industry: string;
  region: string;
  growth_rate_pct: number;
  avg_salary_usd: number;
  active_job_postings: number;
  time_period: string;
  created_at: string;
}

export interface SkillTrend {
  id: string;
  skill_name: string;
  category: string;
  demand_score: number;
  growth_yoy_pct: number;
  avg_salary_premium_pct: number;
  forecast_tier: 'surging' | 'stable' | 'declining';
  updated_at: string;
}

export interface HiringStatistic {
  id: string;
  role_title: string;
  region: string;
  talent_availability_count: number;
  avg_days_to_hire: number;
  competition_level: 'high' | 'moderate' | 'low';
  updated_at: string;
}

export interface CareerRecommendation {
  recommended_skill: string;
  market_demand: string;
  salary_bump_est: string;
  reason: string;
  match_confidence: number;
}
