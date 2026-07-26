export type CompanionMode = 'career_chat' | 'interview_coaching' | 'roadmap_gen';
export type MessageSender = 'user' | 'assistant';

export interface AIMessage {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  mode: CompanionMode;
  status: string;
  created_at: string;
  updated_at: string;
  messages?: AIMessage[];
}

export interface CareerMilestone {
  step_number: number;
  title: string;
  description: string;
  duration: string;
  key_skills: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CareerPlan {
  id: string;
  user_id: string;
  target_role: string;
  target_salary: string;
  current_level: string;
  milestones: CareerMilestone[];
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface AIUserContext {
  id: string;
  user_id: string;
  career_goals: string[];
  skill_gaps: string[];
  preferred_industry: string;
  memory_summary: string;
  updated_at: string;
}
