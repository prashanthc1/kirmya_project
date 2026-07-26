export type CourseCategory = 
  | 'Technology'
  | 'Management'
  | 'Soft skills'
  | 'Interview preparation'
  | 'Industry certifications';

export type CourseProvider = 'kirmya' | 'coursera' | 'udemy' | 'pluralsight';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  difficulty_level: DifficultyLevel;
  provider: CourseProvider;
  external_course_id?: string;
  external_url?: string;
  thumbnail_url?: string;
  duration_hours: number;
  total_lessons: number;
  rating: number;
  skills_covered: string[];
  created_at: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  target_role: string;
  category: CourseCategory;
  estimated_weeks: number;
  course_ids: string[];
  courses?: Course[];
  badge_name: string;
  created_at: string;
}

export interface UserLearningProgress {
  id: string;
  user_id: string;
  course_id: string;
  course_title?: string;
  learning_path_id?: string;
  status: 'enrolled' | 'in_progress' | 'completed';
  completed_lessons: number;
  total_lessons: number;
  completion_percentage: number;
  time_spent_minutes: number;
  last_accessed_at: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  user_name: string;
  course_id?: string;
  learning_path_id?: string;
  title: string;
  verification_code: string;
  skills_mastered: string[];
  issue_date: string;
}

export interface SkillAssessment {
  id: string;
  user_id: string;
  domain: CourseCategory;
  score: number;
  readiness_level: string;
  recommended_path_id?: string;
  created_at: string;
}

export interface SubmitAssessmentPayload {
  domain: CourseCategory;
  answers: Record<string, number>;
}

export interface UpdateProgressPayload {
  course_id: string;
  completed_lessons: number;
  time_spent_minutes?: number;
}
