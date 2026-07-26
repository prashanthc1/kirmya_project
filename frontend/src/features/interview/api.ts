import axios from 'axios';
import {
  CreateInterviewPayload,
  CreateRoundPayload,
  SubmitFeedbackPayload,
  SetAvailabilityPayload,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

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
