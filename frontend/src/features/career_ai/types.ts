export type RecommendationCategory = 
  | 'career_trajectory'
  | 'resume_fix'
  | 'skill_bridge'
  | 'search_strategy'
  | 'interview_hint';

export interface UserContext {
  current_role: string;
  target_role: string;
  years_exp: number;
  current_skills: string[];
  target_skills?: string[];
  job_loss_context?: string;
  resume_snippet?: string;
}

export interface CareerSession {
  id: string;
  user_id: string;
  session_type: string;
  title: string;
  active_topic: string;
  user_context_snapshot: UserContext;
  status: string;
  created_at: string;
  updated_at: string;
  recommendations?: AIRecommendation[];
}

export interface AIRecommendation {
  id: string;
  session_id: string;
  user_id: string;
  category: RecommendationCategory;
  title: string;
  content_text: string;
  priority_score: number;
  action_items: string[];
  bookmarked: boolean;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  session_id?: string;
  provider_name: string;
  model_name: string;
  request_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  created_at: string;
}

export interface GenerateCareerPayload {
  user_context: UserContext;
  topic?: string;
}

export interface ResumeCritiquePayload {
  resume_text: string;
  target_role?: string;
}

export interface SkillGapPayload {
  current_skills: string[];
  target_role: string;
}

export interface JobGuidancePayload {
  target_role: string;
  location?: string;
}

export interface InterviewPrepPayload {
  target_role: string;
  focus_area?: string;
}
