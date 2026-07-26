export type BadgeTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type QuestionType = 'mcq' | 'practical';

export interface Question {
  id: string;
  assessment_id: string;
  question_type: QuestionType;
  question_text: string;
  options?: string[];
  practical_rubric?: string;
  max_points: number;
  question_order: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  passing_score: number;
  total_questions: number;
  badge_title: string;
  badge_tier: BadgeTier;
  created_at: string;
  questions?: Question[];
}

export interface SkillBadge {
  id: string;
  user_id: string;
  user_name: string;
  assessment_id: string;
  badge_title: string;
  tier: BadgeTier;
  verification_code: string;
  skills_validated: string[];
  icon_name?: string;
  issued_at: string;
}

export interface UserAssessmentResult {
  id: string;
  user_id: string;
  user_name?: string;
  assessment_id: string;
  assessment_title: string;
  score_percentage: number;
  mcq_score: number;
  practical_ai_score: number;
  percentile_rank: number;
  passed: boolean;
  time_taken_seconds: number;
  ai_feedback_summary?: string;
  earned_badge?: SkillBadge;
  completed_at: string;
}

export interface UserAnswerSubmission {
  question_id: string;
  selected_option?: number;
  practical_response?: string;
}

export interface SubmitTestPayload {
  time_taken_seconds: number;
  answers: UserAnswerSubmission[];
}
