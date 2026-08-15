export interface MentorCapacity {
  max_mentees: number;
  current_mentees: number;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  bio: string;
  skills: string[];
  topics: string[];
  industry: string;
  experience_years: number;
  availability: 'available' | 'busy' | 'unavailable';
  capacity: MentorCapacity;
  pricing_model: 'free' | 'paid' | 'pro_bono';
  rate?: number;
  rating: number;
  total_reviews: number;
  preferred_formats: ('one_on_one' | 'async' | 'group' | 'code_review')[];
  location?: string;
  linkedin_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type MentorshipFormat = 'one_on_one' | 'async' | 'group' | 'code_review';

export interface MentorshipRequest {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentee_name: string;
  mentee_avatar?: string;
  mentor_name?: string;
  mentor_title?: string;
  mentor_avatar?: string;
  status: RequestStatus;
  note: string;
  requested_topics: string[];
  format: MentorshipFormat;
  preferred_times: string[];
  created_at: string;
  updated_at: string;
}

export type MentorshipStatus = 'active' | 'completed' | 'paused';

export interface MentorshipGoal {
  id: string;
  mentorship_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  target_date: string;
  progress: number; // 0 to 100
  created_at: string;
  updated_at: string;
}

export type SessionFormat = 'video' | 'chat' | 'audio' | 'async';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface MentorshipSession {
  id: string;
  mentorship_id: string;
  mentor_id: string;
  mentee_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  format: SessionFormat;
  meeting_url?: string;
  notes?: string;
  created_at: string;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentor_name: string;
  mentee_name: string;
  mentor_profile?: MentorProfile;
  status: MentorshipStatus;
  started_at: string;
  goals: MentorshipGoal[];
  sessions: MentorshipSession[];
  created_at: string;
  updated_at: string;
}

export interface MentorshipFeedback {
  id: string;
  mentorship_id: string;
  session_id?: string;
  reviewer_id: string;
  reviewer_role: 'mentor' | 'mentee';
  rating: number; // 1-5
  comments: string;
  tags: string[];
  created_at: string;
}

export interface MentorFilterParams {
  search?: string;
  skills?: string[];
  industry?: string;
  topics?: string[];
  min_experience?: number;
  max_experience?: number;
  availability?: 'available' | 'busy' | 'unavailable' | 'all';
  format?: MentorshipFormat | 'all';
  page?: number;
  limit?: number;
}
