export interface InterviewPreparation {
  id: string;
  user_id: string;
  job_id?: string;
  application_id?: string;
  company_name: string;
  job_title: string;
  job_description: string;
  interview_date?: string;
  interview_type: string;
  interview_round: string;
  experience_level: string;
  preparation_duration: string;
  status: string;
  readiness_score: number;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: string;
  preparation_id?: string;
  user_id: string;
  question: string;
  category: string;
  difficulty: string;
  sample_answer: string;
  user_answer: string;
  notes: string;
  is_practiced: boolean;
  is_saved: boolean;
  star_situation: string;
  star_task: string;
  star_action: string;
  star_result: string;
  created_at: string;
}

export interface MockInterviewAnswer {
  id: string;
  session_id: string;
  question_text: string;
  candidate_answer: string;
  audio_transcript: string;
  overall_score: number;
  relevance_score: number;
  clarity_score: number;
  confidence_score: number;
  technical_score: number;
  communication_score: number;
  structure_score: number;
  what_went_well: string;
  what_could_improve: string;
  suggested_answer: string;
  has_star_situation: boolean;
  has_star_task: boolean;
  has_star_action: boolean;
  has_star_result: boolean;
  created_at: string;
}

export interface MockInterviewSession {
  id: string;
  user_id: string;
  preparation_id?: string;
  title: string;
  interview_type: string;
  difficulty: string;
  total_questions: number;
  completed_questions: number;
  overall_score: number;
  relevance_score: number;
  clarity_score: number;
  confidence_score: number;
  technical_score: number;
  communication_score: number;
  structure_score: number;
  status: string;
  started_at: string;
  completed_at?: string;
  answers?: MockInterviewAnswer[];
}

export interface PreparationTask {
  id: string;
  preparation_id: string;
  title: string;
  category: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
}

export interface InterviewNote {
  id: string;
  preparation_id: string;
  user_id: string;
  interviewers: string;
  topics_discussed: string;
  questions_asked: string;
  candidate_performance: string;
  personal_notes: string;
  overall_feeling: string;
  potential_strengths: string;
  potential_weaknesses: string;
  follow_up_suggestions: string;
  thank_you_draft: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewReadinessScore {
  user_id: string;
  overall_readiness: number;
  technical_readiness: number;
  behavioral_readiness: number;
  communication_readiness: number;
  role_fit_readiness: number;
  company_knowledge_readiness: number;
  total_mock_sessions: number;
  total_questions_practiced: number;
  updated_at: string;
}

export interface AICoachMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface AICoachSession {
  id: string;
  user_id: string;
  topic: string;
  messages: AICoachMessage[];
  created_at: string;
  updated_at: string;
}

// Request Payload Types

export interface CreatePreparationRequest {
  job_id?: string;
  application_id?: string;
  company_name: string;
  job_title: string;
  job_description?: string;
  interview_date?: string;
  interview_type?: string;
  interview_round?: string;
  experience_level?: string;
  preparation_duration?: string;
}

export interface UpdatePreparationRequest {
  company_name?: string;
  job_title?: string;
  job_description?: string;
  interview_date?: string;
  interview_type?: string;
  interview_round?: string;
  experience_level?: string;
  preparation_duration?: string;
  status?: string;
}

export interface GenerateQuestionsRequest {
  preparation_id?: string;
  job_title?: string;
  company_name?: string;
  category?: string;
  difficulty?: string;
  count?: number;
}

export interface SaveQuestionRequest {
  preparation_id?: string;
  question: string;
  category?: string;
  difficulty?: string;
  sample_answer?: string;
  user_answer?: string;
  notes?: string;
  star_situation?: string;
  star_task?: string;
  star_action?: string;
  star_result?: string;
}

export interface UpdateQuestionPracticeRequest {
  user_answer?: string;
  notes?: string;
  star_situation?: string;
  star_task?: string;
  star_action?: string;
  star_result?: string;
  is_practiced?: boolean;
}

export interface StartMockSessionRequest {
  preparation_id?: string;
  title?: string;
  interview_type?: string;
  difficulty?: string;
  total_questions?: number;
}

export interface SubmitMockAnswerRequest {
  question_text: string;
  candidate_answer?: string;
  audio_transcript?: string;
}

export interface CreateTaskRequest {
  preparation_id: string;
  title: string;
  category?: string;
  due_date?: string;
}

export interface SaveInterviewNoteRequest {
  preparation_id: string;
  interviewers?: string;
  topics_discussed?: string;
  questions_asked?: string;
  candidate_performance?: string;
  personal_notes?: string;
  overall_feeling?: string;
  potential_strengths?: string;
  potential_weaknesses?: string;
  follow_up_suggestions?: string;
  generate_thank_you?: boolean;
}

export interface AICoachChatRequest {
  session_id?: string;
  topic?: string;
  message: string;
}
