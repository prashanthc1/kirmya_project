import axios from 'axios';

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

export const notificationApi = {
  getMockUserId: () => MOCK_USER_ID,

  listNotifications: async () => {
    const response = await client.get('/notifications');
    return response.data;
  },

  markRead: async (id: string) => {
    const response = await client.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await client.put('/notifications/read-all');
    return response.data;
  },

  getPreferences: async () => {
    const response = await client.get('/notifications/preferences');
    return response.data;
  },

  updatePreference: async (payload: {
    notificationType: string;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
  }) => {
    const response = await client.put('/notifications/preferences', payload);
    return response.data;
  },
};
