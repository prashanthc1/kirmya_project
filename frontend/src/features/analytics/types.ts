export interface SkillDemandItem {
  skill: string;
  count: number;
  share: number;
}

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  user_growth_rate: number;
  total_job_openings: number;
  hiring_velocity_days: number;
  skill_demand_heatmap: SkillDemandItem[];
  market_trend_summary: string;
}

export interface ConversionStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface RecruiterAnalytics {
  total_candidates_screened: number;
  avg_time_to_hire_days: number;
  application_to_offer_rate: number;
  candidate_funnel: ConversionStage[];
  top_performing_job: string;
  job_views_count: number;
}

export interface UserAnalytics {
  profile_views_count: number;
  search_appearances_count: number;
  applications_count: number;
  interview_invitation_rate: number;
  profile_completeness: number;
  top_searching_companies: string[];
}

export interface TrackEventPayload {
  event_name: string;
  entity_id?: string;
  properties?: Record<string, any>;
}
