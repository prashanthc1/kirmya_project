import { apiClient } from '@/services/api';
import {
  CreateInterviewPayload,
  CreateRoundPayload,
  SubmitFeedbackPayload,
  SetAvailabilityPayload,
} from './types';

const client = apiClient;

export const interviewApi = {
  scheduleInterview: async (payload: CreateInterviewPayload) => {
    const response = await client.post('/interviews', payload);
    return response.data;
  },

  getInterview: async (id: string) => {
    const response = await client.get(`/interviews/${id}`);
    return response.data;
  },

  listInterviews: async (params?: {
    candidate_id?: string;
    organizer_id?: string;
    status?: string;
  }) => {
    const response = await client.get('/interviews', { params });
    return response.data;
  },

  updateInterviewStatus: async (id: string, status: string) => {
    const response = await client.put(`/interviews/${id}/status`, { status });
    return response.data;
  },

  addRound: async (interviewId: string, payload: CreateRoundPayload) => {
    const response = await client.post(`/interviews/${interviewId}/rounds`, payload);
    return response.data;
  },

  updateRoundStatus: async (roundId: string, status: string) => {
    const response = await client.put(`/interviews/rounds/${roundId}/status`, { status });
    return response.data;
  },

  submitFeedback: async (roundId: string, payload: SubmitFeedbackPayload) => {
    const response = await client.post(`/interviews/rounds/${roundId}/feedback`, payload);
    return response.data;
  },

  getRoundFeedback: async (roundId: string) => {
    const response = await client.get(`/interviews/rounds/${roundId}/feedback`);
    return response.data;
  },

  setAvailability: async (payload: SetAvailabilityPayload) => {
    const response = await client.post('/interviews/availability', payload);
    return response.data;
  },

  getCandidateAvailability: async (candidateId: string) => {
    const response = await client.get(`/interviews/availability/${candidateId}`);
    return response.data;
  },

  getReminders: async () => {
    const response = await client.get('/interviews/reminders');
    return response.data;
  },
};

export default interviewApi;
