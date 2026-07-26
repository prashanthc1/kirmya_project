export type MatchTier = 'strong_match' | 'good_match' | 'potential_match';
export type FeedbackType = 'relevant' | 'not_relevant' | 'applied' | 'dismissed';

export interface RecommendedAction {
  type: string;
  title: string;
  description: string;
  action_url: string;
}

export interface MatchingScore {
  id: string;
  match_id: string;
  skills_score: number;
  experience_score: number;
  goals_score: number;
  location_score: number;
  salary_score: number;
  learning_score: number;
  applications_score: number;
  feature_vector?: Record<string, any>;
  created_at: string;
}

export interface AIJobMatch {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  overall_score: number;
  match_tier: MatchTier;
  explanation: string;
  matched_skills: string[];
  missing_skills: string[];
  recommended_actions: RecommendedAction[];
  created_at: string;
  breakdown?: MatchingScore;
}

export interface MatchingFeedback {
  id: string;
  match_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  notes?: string;
  created_at: string;
}
