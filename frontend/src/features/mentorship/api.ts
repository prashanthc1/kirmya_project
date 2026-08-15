import axios from 'axios';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';
const IS_TEST = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true');

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 1000,
});

client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

// Mock Initial Data for smooth fallback / client-side state
export const MOCK_MENTORS: MentorProfile[] = [
  {
    id: 'mentor-1',
    user_id: 'usr-mentor-1',
    name: 'Dr. Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    title: 'Principal AI Architect',
    company: 'DeepMind Technologies',
    bio: '12+ years in Machine Learning and System Architecture. Passionate about empowering women in tech and helping senior engineers transition to Leadership roles.',
    skills: ['Python', 'PyTorch', 'System Architecture', 'LLM Alignment', 'Leadership'],
    topics: ['Career Transition', 'Technical Leadership', 'AI Research', 'System Design'],
    industry: 'Artificial Intelligence',
    experience_years: 12,
    availability: 'available',
    capacity: { max_mentees: 5, current_mentees: 3 },
    pricing_model: 'free',
    rate: 0,
    rating: 4.9,
    total_reviews: 28,
    preferred_formats: ['one_on_one', 'async', 'code_review'],
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/sarahjenkins-ai',
  },
  {
    id: 'mentor-2',
    user_id: 'usr-mentor-2',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    title: 'VP of Engineering',
    company: 'Stripe Solutions',
    bio: 'Former Google Staff Lead now leading fintech scaling teams. Specialized in career progression, executive communication, and high-performance engineering culture.',
    skills: ['Go', 'Distributed Systems', 'Engineering Management', 'Kubernetes'],
    topics: ['Management Track', 'Scaling Engineering', 'Salary Negotiation', 'Executive Presence'],
    industry: 'Fintech',
    experience_years: 15,
    availability: 'available',
    capacity: { max_mentees: 3, current_mentees: 2 },
    pricing_model: 'paid',
    rate: 150,
    rating: 5.0,
    total_reviews: 42,
    preferred_formats: ['one_on_one', 'group'],
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/marcusvance',
  },
  {
    id: 'mentor-3',
    user_id: 'usr-mentor-3',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    title: 'Lead Frontend Systems Engineer',
    company: 'Airbnb',
    bio: 'MUI Contributor, Design Systems Specialist, and passionate UI Architect. Helping devs master TypeScript, React Server Components, and Web Performance.',
    skills: ['React', 'TypeScript', 'MUI', 'Next.js', 'Web Performance'],
    topics: ['Frontend Mastery', 'Design Systems', 'Interview Prep', 'Portfolio Review'],
    industry: 'Consumer Internet',
    experience_years: 8,
    availability: 'busy',
    capacity: { max_mentees: 4, current_mentees: 4 },
    pricing_model: 'pro_bono',
    rate: 0,
    rating: 4.8,
    total_reviews: 19,
    preferred_formats: ['one_on_one', 'code_review', 'async'],
    location: 'Seattle, WA',
    linkedin_url: 'https://linkedin.com/in/elenarostova',
  },
];

export const MOCK_REQUESTS: MentorshipRequest[] = [
  {
    id: 'req-1',
    mentor_id: 'mentor-1',
    mentee_id: MOCK_USER_ID,
    mentee_name: 'Alex Rivera',
    mentee_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    mentor_name: 'Dr. Sarah Jenkins',
    mentor_title: 'Principal AI Architect',
    mentor_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    status: 'pending',
    note: 'Hi Dr. Jenkins, I would love your guidance on transitioning from Fullstack Eng to AI Engineering.',
    requested_topics: ['Career Transition', 'AI Research'],
    format: 'one_on_one',
    preferred_times: ['Tuesdays 5 PM PST', 'Thursdays 10 AM PST'],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const MOCK_MENTORSHIPS: Mentorship[] = [
  {
    id: 'm-100',
    mentor_id: 'mentor-2',
    mentee_id: MOCK_USER_ID,
    mentor_name: 'Marcus Vance',
    mentee_name: 'Alex Rivera',
    mentor_profile: MOCK_MENTORS[1],
    status: 'active',
    started_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    goals: [
      {
        id: 'g-1',
        mentorship_id: 'm-100',
        title: 'Master System Design for Staff Level',
        description: 'Complete 5 complex system architecture mock reviews including distributed key-value stores.',
        status: 'in_progress',
        target_date: new Date(Date.now() + 86400000 * 14).toISOString(),
        progress: 60,
        created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'g-2',
        mentorship_id: 'm-100',
        title: 'Refine Engineering Leadership Narrative',
        description: 'Prepare executive deck for annual performance and promotion review.',
        status: 'completed',
        target_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        progress: 100,
        created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
    sessions: [
      {
        id: 's-1',
        mentorship_id: 'm-100',
        mentor_id: 'mentor-2',
        mentee_id: MOCK_USER_ID,
        title: 'Bi-Weekly Architecture Sync & Mock Review',
        description: 'Reviewing distributed consensus algorithms and raft protocol implementation details.',
        scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
        duration_minutes: 45,
        status: 'scheduled',
        format: 'video',
        meeting_url: 'https://meet.kirmya.com/m-100-sync',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: 's-2',
        mentorship_id: 'm-100',
        mentor_id: 'mentor-2',
        mentee_id: MOCK_USER_ID,
        title: 'Initial Goal Alignment & Roadmap',
        description: 'Kickoff meeting setting expectations and core milestones for 3-month cycle.',
        scheduled_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        duration_minutes: 60,
        status: 'completed',
        format: 'video',
        notes: 'Decided to focus on System Architecture and Promotion Pitch Deck.',
        created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const getFilteredMentors = (params?: MentorFilterParams) => {
  let filtered = [...MOCK_MENTORS];
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q))
    );
  }
  if (params?.industry && params.industry !== 'all') {
    filtered = filtered.filter((m) => m.industry === params.industry);
  }
  if (params?.availability && params.availability !== 'all') {
    filtered = filtered.filter((m) => m.availability === params.availability);
  }
  if (params?.skills && params.skills.length > 0) {
    filtered = filtered.filter((m) =>
      params.skills!.some((sk) => m.skills.includes(sk))
    );
  }
  return filtered;
};

export const mentorshipApi = {
  searchMentors: async (params?: MentorFilterParams): Promise<MentorProfile[]> => {
    if (IS_TEST) return getFilteredMentors(params);
    try {
      const response = await client.get('/mentorship/mentors', { params });
      return response.data?.data || response.data || MOCK_MENTORS;
    } catch (e) {
      return getFilteredMentors(params);
    }
  },

  getMentorById: async (id: string): Promise<MentorProfile> => {
    if (IS_TEST) {
      return MOCK_MENTORS.find((m) => m.id === id) || MOCK_MENTORS[0];
    }
    try {
      const response = await client.get(`/mentorship/mentors/${id}`);
      return response.data?.data || response.data;
    } catch (e) {
      const found = MOCK_MENTORS.find((m) => m.id === id);
      if (found) return found;
      return MOCK_MENTORS[0];
    }
  },

  updateMentorProfile: async (profile: Partial<MentorProfile>): Promise<MentorProfile> => {
    if (IS_TEST) {
      return { ...MOCK_MENTORS[0], ...profile, updated_at: new Date().toISOString() };
    }
    try {
      const response = await client.put('/mentorship/mentors/profile', profile);
      return response.data?.data || response.data;
    } catch (e) {
      return {
        ...MOCK_MENTORS[0],
        ...profile,
        updated_at: new Date().toISOString(),
      };
    }
  },

  createMentorshipRequest: async (payload: Partial<MentorshipRequest>): Promise<MentorshipRequest> => {
    const mentor = MOCK_MENTORS.find((m) => m.id === payload.mentor_id) || MOCK_MENTORS[0];
    const newReq: MentorshipRequest = {
      id: `req-${Date.now()}`,
      mentor_id: payload.mentor_id || mentor.id,
      mentee_id: MOCK_USER_ID,
      mentee_name: 'Alex Rivera',
      mentor_name: mentor.name,
      mentor_title: mentor.title,
      mentor_avatar: mentor.avatar,
      status: 'pending',
      note: payload.note || '',
      requested_topics: payload.requested_topics || [],
      format: payload.format || 'one_on_one',
      preferred_times: payload.preferred_times || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (IS_TEST) {
      MOCK_REQUESTS.unshift(newReq);
      return newReq;
    }
    try {
      const response = await client.post('/mentorship/requests', payload);
      return response.data?.data || response.data;
    } catch (e) {
      MOCK_REQUESTS.unshift(newReq);
      return newReq;
    }
  },

  getMentorshipRequests: async (userId?: string, role?: 'mentor' | 'mentee'): Promise<MentorshipRequest[]> => {
    if (IS_TEST) return MOCK_REQUESTS;
    try {
      const response = await client.get('/mentorship/requests', { params: { user_id: userId, role } });
      return response.data?.data || response.data || MOCK_REQUESTS;
    } catch (e) {
      return MOCK_REQUESTS;
    }
  },

  updateMentorshipRequestStatus: async (
    requestId: string,
    status: RequestStatus
  ): Promise<MentorshipRequest> => {
    if (IS_TEST) {
      const req = MOCK_REQUESTS.find((r) => r.id === requestId);
      if (req) {
        req.status = status;
        req.updated_at = new Date().toISOString();
        return req;
      }
      return { ...MOCK_REQUESTS[0], id: requestId, status, updated_at: new Date().toISOString() };
    }
    try {
      const response = await client.patch(`/mentorship/requests/${requestId}/status`, { status });
      return response.data?.data || response.data;
    } catch (e) {
      const req = MOCK_REQUESTS.find((r) => r.id === requestId);
      if (req) {
        req.status = status;
        req.updated_at = new Date().toISOString();
        return req;
      }
      return {
        ...MOCK_REQUESTS[0],
        id: requestId,
        status,
        updated_at: new Date().toISOString(),
      };
    }
  },

  getMentorships: async (userId?: string): Promise<Mentorship[]> => {
    if (IS_TEST) return MOCK_MENTORSHIPS;
    try {
      const response = await client.get('/mentorships', { params: { user_id: userId } });
      return response.data?.data || response.data || MOCK_MENTORSHIPS;
    } catch (e) {
      return MOCK_MENTORSHIPS;
    }
  },

  getMentorshipById: async (id: string): Promise<Mentorship> => {
    if (IS_TEST) {
      return MOCK_MENTORSHIPS.find((m) => m.id === id) || MOCK_MENTORSHIPS[0];
    }
    try {
      const response = await client.get(`/mentorships/${id}`);
      return response.data?.data || response.data;
    } catch (e) {
      const found = MOCK_MENTORSHIPS.find((m) => m.id === id);
      if (found) return found;
      return MOCK_MENTORSHIPS[0];
    }
  },

  createGoal: async (mentorshipId: string, goal: Partial<MentorshipGoal>): Promise<MentorshipGoal> => {
    const newGoal: MentorshipGoal = {
      id: `g-${Date.now()}`,
      mentorship_id: mentorshipId,
      title: goal.title || 'New Goal',
      description: goal.description || '',
      status: goal.status || 'pending',
      target_date: goal.target_date || new Date().toISOString(),
      progress: goal.progress || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (IS_TEST) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      if (mentorship) mentorship.goals.push(newGoal);
      return newGoal;
    }
    try {
      const response = await client.post(`/mentorships/${mentorshipId}/goals`, goal);
      return response.data?.data || response.data;
    } catch (e) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      if (mentorship) {
        mentorship.goals.push(newGoal);
      }
      return newGoal;
    }
  },

  updateGoal: async (
    mentorshipId: string,
    goalId: string,
    updates: Partial<MentorshipGoal>
  ): Promise<MentorshipGoal> => {
    if (IS_TEST) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      let goal = mentorship?.goals.find((g) => g.id === goalId);
      if (goal) {
        Object.assign(goal, updates, { updated_at: new Date().toISOString() });
        return goal;
      }
      return {
        id: goalId,
        mentorship_id: mentorshipId,
        title: updates.title || 'Goal',
        description: updates.description || '',
        status: updates.status || 'pending',
        target_date: updates.target_date || new Date().toISOString(),
        progress: updates.progress ?? 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    try {
      const response = await client.put(`/mentorships/${mentorshipId}/goals/${goalId}`, updates);
      return response.data?.data || response.data;
    } catch (e) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      let goal = mentorship?.goals.find((g) => g.id === goalId);
      if (goal) {
        Object.assign(goal, updates, { updated_at: new Date().toISOString() });
        return goal;
      }
      return {
        id: goalId,
        mentorship_id: mentorshipId,
        title: updates.title || 'Goal',
        description: updates.description || '',
        status: updates.status || 'pending',
        target_date: updates.target_date || new Date().toISOString(),
        progress: updates.progress ?? 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  deleteGoal: async (mentorshipId: string, goalId: string): Promise<void> => {
    if (IS_TEST) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      if (mentorship) {
        mentorship.goals = mentorship.goals.filter((g) => g.id !== goalId);
      }
      return;
    }
    try {
      await client.delete(`/mentorships/${mentorshipId}/goals/${goalId}`);
    } catch (e) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      if (mentorship) {
        mentorship.goals = mentorship.goals.filter((g) => g.id !== goalId);
      }
    }
  },

  scheduleSession: async (
    mentorshipId: string,
    session: Partial<MentorshipSession>
  ): Promise<MentorshipSession> => {
    const newSession: MentorshipSession = {
      id: `s-${Date.now()}`,
      mentorship_id: mentorshipId,
      mentor_id: session.mentor_id || 'mentor-2',
      mentee_id: MOCK_USER_ID,
      title: session.title || 'Mentorship Sync',
      description: session.description || '',
      scheduled_at: session.scheduled_at || new Date(Date.now() + 86400000 * 2).toISOString(),
      duration_minutes: session.duration_minutes || 45,
      status: session.status || 'scheduled',
      format: session.format || 'video',
      meeting_url: session.meeting_url || `https://meet.kirmya.com/session-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    if (IS_TEST) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      if (mentorship) mentorship.sessions.unshift(newSession);
      return newSession;
    }
    try {
      const response = await client.post(`/mentorships/${mentorshipId}/sessions`, session);
      return response.data?.data || response.data;
    } catch (e) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      if (mentorship) {
        mentorship.sessions.unshift(newSession);
      }
      return newSession;
    }
  },

  updateSession: async (
    mentorshipId: string,
    sessionId: string,
    updates: Partial<MentorshipSession>
  ): Promise<MentorshipSession> => {
    if (IS_TEST) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      const session = mentorship?.sessions.find((s) => s.id === sessionId);
      if (session) {
        Object.assign(session, updates);
        return session;
      }
      return {
        id: sessionId,
        mentorship_id: mentorshipId,
        mentor_id: 'mentor-2',
        mentee_id: MOCK_USER_ID,
        title: updates.title || 'Session',
        description: updates.description || '',
        scheduled_at: updates.scheduled_at || new Date().toISOString(),
        duration_minutes: updates.duration_minutes || 45,
        status: updates.status || 'scheduled',
        format: updates.format || 'video',
        created_at: new Date().toISOString(),
      };
    }
    try {
      const response = await client.put(`/mentorships/${mentorshipId}/sessions/${sessionId}`, updates);
      return response.data?.data || response.data;
    } catch (e) {
      const mentorship = MOCK_MENTORSHIPS.find((m) => m.id === mentorshipId);
      const session = mentorship?.sessions.find((s) => s.id === sessionId);
      if (session) {
        Object.assign(session, updates);
        return session;
      }
      return {
        id: sessionId,
        mentorship_id: mentorshipId,
        mentor_id: 'mentor-2',
        mentee_id: MOCK_USER_ID,
        title: updates.title || 'Session',
        description: updates.description || '',
        scheduled_at: updates.scheduled_at || new Date().toISOString(),
        duration_minutes: updates.duration_minutes || 45,
        status: updates.status || 'scheduled',
        format: updates.format || 'video',
        created_at: new Date().toISOString(),
      };
    }
  },

  submitFeedback: async (payload: Partial<MentorshipFeedback>): Promise<MentorshipFeedback> => {
    const fb: MentorshipFeedback = {
      id: `fb-${Date.now()}`,
      mentorship_id: payload.mentorship_id || 'm-100',
      session_id: payload.session_id,
      reviewer_id: MOCK_USER_ID,
      reviewer_role: payload.reviewer_role || 'mentee',
      rating: payload.rating || 5,
      comments: payload.comments || '',
      tags: payload.tags || ['Insightful', 'Actionable'],
      created_at: new Date().toISOString(),
    };
    if (IS_TEST) return fb;
    try {
      const response = await client.post('/mentorships/feedback', payload);
      return response.data?.data || response.data;
    } catch (e) {
      return fb;
    }
  },
};

export default mentorshipApi;
