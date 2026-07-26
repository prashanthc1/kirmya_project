export interface ResumeScores {
  id: string;
  analysis_id: string;
  overall_score: number; // 0-100
  ats_compatibility_score: number; // 0-100
  structure_score: number;
  skills_score: number;
  experience_score: number;
  job_match_score: number;
  created_at: string;
}

export interface ImprovementHistory {
  id: string;
  analysis_id: string;
  user_id: string;
  missing_skills: string[];
  present_keywords: string[];
  missing_keywords: string[];
  keyword_density_score: number;
  structure_feedback: string[];
  experience_bullet_fixes: string[];
  general_suggestions: string[];
  created_at: string;
}

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  target_job_title: string;
  target_job_description: string;
  resume_text: string;
  status: string;
  created_at: string;
  scores?: ResumeScores;
  improvements?: ImprovementHistory;
}

export interface AnalyzeResumePayload {
  resume_text: string;
  target_job_title: string;
  target_job_description?: string;
}
