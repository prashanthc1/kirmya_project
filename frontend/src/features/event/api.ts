import { apiClient } from '@/services/api';
import { CreateEventPayload, Event, EventAttendee, RegisterEventPayload } from './types';

const client = apiClient;

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
