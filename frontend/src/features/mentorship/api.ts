import { apiClient } from '@/services/api';
import {
  MentorProfile,
  MentorshipRequest,
  Mentorship,
  MentorshipGoal,
  MentorshipSession,
  MentorshipFeedback,
  MentorFilterParams,
  RequestStatus,
} from './types';

const client = apiClient;

// This client used to answer from a fixture set built into the bundle: every
// call fell back to invented mentors, and under test it never made a request at
// all. A failed load now fails, so the page can say so instead of showing a
// mentor who does not exist.
const unwrap = <T,>(payload: any, key: string, fallback: T): T => {
  if (payload == null) return fallback;
  if (Array.isArray(payload)) return payload as unknown as T;
  return (payload[key] ?? payload.data ?? fallback) as T;
};

export const mentorshipApi = {
  searchMentors: async (params?: MentorFilterParams): Promise<MentorProfile[]> => {
    const response = await client.get('/mentorship/mentors/search', { params });
    return unwrap<MentorProfile[]>(response.data, 'mentors', []);
  },

  getRecommendedMentors: async (): Promise<MentorProfile[]> => {
    const response = await client.get('/mentorship/mentors/recommendations');
    return unwrap<MentorProfile[]>(response.data, 'recommendations', []);
  },

  getMentorById: async (id: string): Promise<MentorProfile> => {
    const response = await client.get(`/mentorship/mentors/${id}`);
    return unwrap<MentorProfile>(response.data, 'profile', response.data);
  },

  getMyMentorProfile: async (): Promise<MentorProfile | null> => {
    const response = await client.get('/mentorship/mentors/profile');
    return unwrap<MentorProfile | null>(response.data, 'profile', null);
  },

  updateMentorProfile: async (profile: Partial<MentorProfile>): Promise<MentorProfile> => {
    const response = await client.post('/mentorship/mentors/profile', profile);
    return unwrap<MentorProfile>(response.data, 'profile', response.data);
  },

  createMentorshipRequest: async (payload: Partial<MentorshipRequest>): Promise<MentorshipRequest> => {
    const response = await client.post('/mentorship/requests', payload);
    return unwrap<MentorshipRequest>(response.data, 'request', response.data);
  },

  getMentorshipRequests: async (userId?: string, role?: 'mentor' | 'mentee'): Promise<MentorshipRequest[]> => {
    const response = await client.get('/mentorship/requests', { params: { role } });
    return unwrap<MentorshipRequest[]>(response.data, 'requests', []);
  },

  updateMentorshipRequestStatus: async (
    requestId: string,
    status: RequestStatus
  ): Promise<MentorshipRequest> => {
    const response = await client.put(`/mentorship/requests/${requestId}/status`, { status });
    return unwrap<MentorshipRequest>(response.data, 'request', response.data);
  },

  getMentorships: async (userId?: string): Promise<Mentorship[]> => {
    const response = await client.get('/mentorship/relationships');
    return unwrap<Mentorship[]>(response.data, 'mentorships', []);
  },

  getMentorshipById: async (id: string): Promise<Mentorship> => {
    const response = await client.get(`/mentorship/relationships/${id}`);
    return unwrap<Mentorship>(response.data, 'mentorship', response.data);
  },

  createGoal: async (mentorshipId: string, goal: Partial<MentorshipGoal>): Promise<MentorshipGoal> => {
    const response = await client.post('/mentorship/goals', { ...goal, mentorship_id: mentorshipId });
    return unwrap<MentorshipGoal>(response.data, 'goal', response.data);
  },

  updateGoal: async (
    mentorshipId: string,
    goalId: string,
    updates: Partial<MentorshipGoal>
  ): Promise<MentorshipGoal> => {
    const response = await client.put(`/mentorship/goals/${goalId}`, updates);
    return unwrap<MentorshipGoal>(response.data, 'goal', response.data);
  },

  deleteGoal: async (mentorshipId: string, goalId: string): Promise<void> => {
    await client.delete(`/mentorship/goals/${goalId}`);
  },

  getSessions: async (mentorshipId?: string): Promise<MentorshipSession[]> => {
    const response = await client.get('/mentorship/sessions', { params: { mentorship_id: mentorshipId } });
    return unwrap<MentorshipSession[]>(response.data, 'sessions', []);
  },

  scheduleSession: async (
    mentorshipId: string,
    session: Partial<MentorshipSession>
  ): Promise<MentorshipSession> => {
    const response = await client.post('/mentorship/sessions', { ...session, mentorship_id: mentorshipId });
    return unwrap<MentorshipSession>(response.data, 'session', response.data);
  },

  updateSession: async (
    mentorshipId: string,
    sessionId: string,
    updates: Partial<MentorshipSession>
  ): Promise<MentorshipSession> => {
    const response = await client.put(`/mentorship/sessions/${sessionId}`, updates);
    return unwrap<MentorshipSession>(response.data, 'session', response.data);
  },

  submitFeedback: async (payload: Partial<MentorshipFeedback>): Promise<MentorshipFeedback> => {
    const response = await client.post('/mentorship/feedback', payload);
    return unwrap<MentorshipFeedback>(response.data, 'feedback', response.data);
  },
};

export default mentorshipApi;
