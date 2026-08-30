import { authApiClient } from '../../services/authService';
import {
  Interview,
  CandidateAvailability,
  ReminderItem,
  CreateInterviewPayload,
  CreateRoundPayload,
  SubmitFeedbackPayload,
  SetAvailabilityPayload,
  InterviewFeedback,
  InterviewRound,
} from './types';

export * from './types';

const client = authApiClient;

export const interviewApi = {
  scheduleInterview: async (payload: CreateInterviewPayload): Promise<{ message: string; interview: Interview }> => {
    const response = await client.post('/interviews', payload);
    return response.data;
  },

  getInterview: async (id: string): Promise<Interview> => {
    const response = await client.get(`/interviews/${id}`);
    return response.data;
  },

  listInterviews: async (params?: {
    candidate_id?: string;
    organizer_id?: string;
    status?: string;
  }): Promise<{ data: Interview[]; count: number }> => {
    const response = await client.get('/interviews', { params });
    return response.data;
  },

  updateInterviewStatus: async (id: string, status: string): Promise<{ message: string; status: string }> => {
    const response = await client.put(`/interviews/${id}/status`, { status });
    return response.data;
  },

  addRound: async (interviewId: string, payload: CreateRoundPayload): Promise<{ message: string; round: InterviewRound }> => {
    const response = await client.post(`/interviews/${interviewId}/rounds`, payload);
    return response.data;
  },

  updateRoundStatus: async (roundId: string, status: string): Promise<{ message: string }> => {
    const response = await client.put(`/interviews/rounds/${roundId}/status`, { status });
    return response.data;
  },

  submitFeedback: async (roundId: string, payload: SubmitFeedbackPayload): Promise<{ message: string; feedback: InterviewFeedback }> => {
    const response = await client.post(`/interviews/rounds/${roundId}/feedback`, payload);
    return response.data;
  },

  getRoundFeedback: async (roundId: string): Promise<{ data: InterviewFeedback[]; count: number }> => {
    const response = await client.get(`/interviews/rounds/${roundId}/feedback`);
    return response.data;
  },

  setAvailability: async (payload: SetAvailabilityPayload): Promise<{ message: string; availability: CandidateAvailability }> => {
    const response = await client.post('/interviews/availability', payload);
    return response.data;
  },

  getCandidateAvailability: async (candidateId: string): Promise<{ data: CandidateAvailability[]; count: number }> => {
    const response = await client.get(`/interviews/availability/${candidateId}`);
    return response.data;
  },

  getReminders: async (): Promise<{ reminders: ReminderItem[]; count: number }> => {
    const response = await client.get('/interviews/reminders');
    return response.data;
  },
};

export default interviewApi;
