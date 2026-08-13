import axios from 'axios';
import {
  NotificationItemDTO,
  NotificationPreferenceDTO,
  QuietHoursDTO,
  NotificationDeviceDTO,
  NotificationDeliveryDTO,
  NotificationTemplateDTO,
  NotificationAnalyticsDTO,
  NotificationScheduleDTO,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const notificationApi = {
  getMockUserId: () => '00000000-0000-0000-0000-000000000001',

  listNotifications: async (params?: { category?: string; unreadOnly?: boolean; limit?: number; offset?: number }): Promise<NotificationItemDTO[]> => {
    const res = await apiClient.get<NotificationItemDTO[]>('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async (): Promise<{ count: number; unreadCount: number }> => {
    const res = await apiClient.get<{ count: number; unreadCount: number }>('/notifications/count');
    return res.data;
  },

  getByID: async (id: string): Promise<NotificationItemDTO> => {
    const res = await apiClient.get<NotificationItemDTO>(`/notifications/${id}`);
    return res.data;
  },

  markRead: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },

  markUnread: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/notifications/${id}/unread`);
    return res.data;
  },

  markAllRead: async (): Promise<{ message: string }> => {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },

  archiveNotification: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/notifications/${id}/archive`);
    return res.data;
  },

  getPreferences: async (): Promise<NotificationPreferenceDTO[]> => {
    const res = await apiClient.get<NotificationPreferenceDTO[]>('/notifications/preferences');
    return res.data;
  },

  updatePreference: async (payload: Partial<NotificationPreferenceDTO>): Promise<{ message: string }> => {
    const res = await apiClient.put('/notifications/preferences', payload);
    return res.data;
  },

  getQuietHours: async (): Promise<QuietHoursDTO> => {
    const res = await apiClient.get<QuietHoursDTO>('/notifications/quiet-hours');
    return res.data;
  },

  updateQuietHours: async (payload: Partial<QuietHoursDTO>): Promise<{ message: string }> => {
    const res = await apiClient.put('/notifications/quiet-hours', payload);
    return res.data;
  },

  registerDevice: async (payload: { deviceToken: string; platform: string }): Promise<{ message: string }> => {
    const res = await apiClient.post('/notifications/devices', payload);
    return res.data;
  },

  getDevices: async (): Promise<NotificationDeviceDTO[]> => {
    const res = await apiClient.get<NotificationDeviceDTO[]>('/notifications/devices');
    return res.data;
  },

  deleteDevice: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/notifications/devices/${id}`);
    return res.data;
  },

  getSchedules: async (): Promise<NotificationScheduleDTO[]> => {
    const res = await apiClient.get<NotificationScheduleDTO[]>('/notifications/schedules');
    return res.data;
  },

  createSchedule: async (payload: Partial<NotificationScheduleDTO>): Promise<NotificationScheduleDTO> => {
    const res = await apiClient.post<NotificationScheduleDTO>('/notifications/schedules', payload);
    return res.data;
  },

  deleteSchedule: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/notifications/schedules/${id}`);
    return res.data;
  },

  getHistory: async (): Promise<NotificationDeliveryDTO[]> => {
    const res = await apiClient.get<NotificationDeliveryDTO[]>('/notifications/history');
    return res.data;
  },

  // Admin APIs
  adminGetTemplates: async (): Promise<NotificationTemplateDTO[]> => {
    const res = await apiClient.get<NotificationTemplateDTO[]>('/admin/notifications/templates');
    return res.data;
  },

  adminCreateTemplate: async (payload: Partial<NotificationTemplateDTO>): Promise<{ message: string }> => {
    const res = await apiClient.post('/admin/notifications/templates', payload);
    return res.data;
  },

  adminGetAnalytics: async (): Promise<NotificationAnalyticsDTO> => {
    const res = await apiClient.get<NotificationAnalyticsDTO>('/admin/notifications/analytics');
    return res.data;
  },

  adminGetFailures: async (): Promise<any[]> => {
    const res = await apiClient.get('/admin/notifications/failures');
    return res.data;
  },

  adminSendAnnouncement: async (payload: { title: string; content: string; category?: string; targetRole?: string; actionUrl?: string }): Promise<{ message: string }> => {
    const res = await apiClient.post('/admin/notifications/announcement', payload);
    return res.data;
  },
};
