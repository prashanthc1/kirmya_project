import axios from 'axios';
import { CreateEventPayload, Event, EventAttendee, RegisterEventPayload } from './types';

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

export const eventApi = {
  getEvents: async (category?: string): Promise<{ data: Event[]; count: number }> => {
    const response = await client.get('/events', {
      params: { category: category || '' },
    });
    return response.data;
  },

  createEvent: async (payload: CreateEventPayload): Promise<{ message: string; event: Event }> => {
    const response = await client.post('/events', payload);
    return response.data;
  },

  getEventByID: async (id: string): Promise<Event> => {
    const response = await client.get(`/events/${id}`);
    return response.data;
  },

  registerAttendee: async (eventId: string, payload?: RegisterEventPayload): Promise<{ message: string; attendee: EventAttendee }> => {
    const response = await client.post(`/events/${eventId}/register`, payload || {});
    return response.data;
  },

  cancelRegistration: async (eventId: string): Promise<{ message: string }> => {
    const response = await client.post(`/events/${eventId}/cancel`);
    return response.data;
  },

  getUserRegistrations: async (): Promise<{ data: Event[]; count: number }> => {
    const response = await client.get('/events/my-events');
    return response.data;
  },
};

export default eventApi;
