export type SessionType =
  | 'candidate_ranking'
  | 'jd_optimization'
  | 'interview_prep'
  | 'outreach_draft';

export interface RecruiterAISession {
  id: string;
  org_id: string;
  recruiter_id: string;
  job_id?: string;
  session_type: SessionType;
  created_at: string;
}

export interface AICandidateScore {
  id: string;
  session_id: string;
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  rank_position: number;
  fit_score: number;
  strengths: string[];
  red_flags: string[];
  match_rationale: string;
  created_at: string;
}

export interface AIGeneratedContent {
  id: string;
  session_id: string;
  content_type: string;
  generated_text: string;
  metadata?: Record<string, any>;
  created_at: string;
}
