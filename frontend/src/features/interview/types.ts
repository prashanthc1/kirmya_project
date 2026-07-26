export type InterviewStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'feedback_pending';

export type ParticipantRole = 
  | 'interviewer'
  | 'lead_interviewer'
  | 'candidate'
  | 'observer';

export type RSVPStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

export type RecommendationType = 
  | 'strong_hire'
  | 'hire'
  | 'neutral'
  | 'no_hire'
  | 'strong_no_hire';

export interface InterviewParticipant {
  id: string;
  interview_id: string;
  round_id?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: ParticipantRole;
  rsvp_status: RSVPStatus;
  created_at: string;
}

export interface InterviewFeedback {
  id: string;
  interview_id: string;
  round_id: string;
  interviewer_id: string;
  interviewer_name: string;
  rating: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  recommendation: RecommendationType;
  feedback_text: string;
  strengths?: string;
  areas_for_improvement?: string;
  created_at: string;
}

export interface InterviewRound {
  id: string;
  interview_id: string;
  round_number: number;
  round_name: string;
  round_type: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  meeting_link?: string;
  instructions?: string;
  created_at: string;
  participants?: InterviewParticipant[];
  feedback?: InterviewFeedback[];
}

export interface Interview {
  id: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  job_id?: string;
  job_title?: string;
  organizer_id: string;
  title: string;
  status: InterviewStatus;
  scheduled_start: string;
  scheduled_end: string;
  location_type: 'virtual' | 'in_person' | 'phone';
  meeting_link: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  rounds?: InterviewRound[];
  participants?: InterviewParticipant[];
}

export interface CandidateAvailability {
  id: string;
  candidate_id: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'unavailable';
  notes?: string;
  created_at: string;
}

export interface ReminderItem {
  interview_id: string;
  round_id?: string;
  title: string;
  round_name?: string;
  candidate_id: string;
  scheduled_start: string;
  scheduled_end: string;
  meeting_link: string;
  minutes_remaining: number;
  role: string;
}

export interface CreateInterviewPayload {
  candidate_id: string;
  job_id?: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  location_type?: string;
  meeting_link?: string;
  notes?: string;
  rounds?: Array<{
    round_number?: number;
    round_name: string;
    round_type?: string;
    scheduled_start: string;
    scheduled_end: string;
    meeting_link?: string;
    instructions?: string;
    participants?: Array<{
      user_id: string;
      user_name?: string;
      user_email?: string;
      role?: string;
    }>;
  }>;
  participants?: Array<{
    user_id: string;
    user_name?: string;
    user_email?: string;
    role?: string;
  }>;
}

export interface CreateRoundPayload {
  round_number?: number;
  round_name: string;
  round_type?: string;
  scheduled_start: string;
  scheduled_end: string;
  meeting_link?: string;
  instructions?: string;
  participants?: Array<{
    user_id: string;
    user_name?: string;
    user_email?: string;
    role?: string;
  }>;
}

export interface SubmitFeedbackPayload {
  rating: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  recommendation: RecommendationType;
  feedback_text: string;
  strengths?: string;
  areas_for_improvement?: string;
}

export interface SetAvailabilityPayload {
  start_time: string;
  end_time: string;
  status?: string;
  notes?: string;
}
