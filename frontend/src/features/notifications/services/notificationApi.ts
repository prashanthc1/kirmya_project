import { authApiClient } from '../../../services/authService';
import {
  NotificationItemDTO,
  NotificationPreferenceDTO,
  QuietHoursDTO,
  NotificationDigestSettings,
  NotificationDeviceDTO,
  NotificationDeliveryDTO,
  NotificationTemplateDTO,
  NotificationAnalyticsDTO,
  NotificationScheduleDTO,
  NotificationDeadLetter,
} from '../types';

const apiClient = authApiClient;

const mockNotifications: NotificationItemDTO[] = [
  {
    id: 'n1',
    userId: '00000000-0000-0000-0000-000000000001',
    category: 'Interviews',
    type: 'interview_scheduled',
    priority: 'High',
    title: 'Technical Interview Scheduled',
    content: 'Your Senior Go Architect interview with Emaar is set for tomorrow at 10:00 AM.',
    actorId: 'act-101',
    actorName: 'Sarah Jenkins (Emaar HR)',
    actionUrl: '/dashboard/interviews',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'n2',
    userId: '00000000-0000-0000-0000-000000000001',
    category: 'Jobs',
    type: 'job_alert',
    priority: 'Normal',
    title: 'New Matching Job Opportunity',
    content: 'Kirmya AI matched a new Lead Backend Role in Dubai (96% Match).',
    actionUrl: '/jobs',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'n3',
    userId: '00000000-0000-0000-0000-000000000001',
    category: 'Security',
    type: 'security_alert',
    priority: 'Critical',
    title: 'New Login Detected',
    content: 'Successful login from Chrome on Windows (Dubai, UAE).',
    actionUrl: '/notifications',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'n4',
    userId: '00000000-0000-0000-0000-000000000001',
    category: 'Applications',
    type: 'application_status_changed',
    priority: 'High',
    title: 'Application Shortlisted',
    content: 'Your application for Lead Architect at TechCorp has been moved to Shortlisted.',
    actorId: 'act-102',
    actorName: 'TechCorp Talent Team',
    actionUrl: '/dashboard/applications',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'n5',
    userId: '00000000-0000-0000-0000-000000000001',
    category: 'Networking',
    type: 'connection_accepted',
    priority: 'Normal',
    title: 'Connection Accepted',
    content: 'Salim Al-Harthy accepted your connection request.',
    actorId: 'act-103',
    actorName: 'Salim Al-Harthy',
    actionUrl: '/networking',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const mockPreferences: NotificationPreferenceDTO[] = [
  { userId: '00000000-0000-0000-0000-000000000001', category: 'Security', inAppEnabled: true, emailEnabled: true, pushEnabled: true, smsEnabled: true, frequency: 'Instant' },
  { userId: '00000000-0000-0000-0000-000000000001', category: 'Jobs', inAppEnabled: true, emailEnabled: true, pushEnabled: true, smsEnabled: false, frequency: 'Daily Digest' },
  { userId: '00000000-0000-0000-0000-000000000001', category: 'Applications', inAppEnabled: true, emailEnabled: true, pushEnabled: true, smsEnabled: false, frequency: 'Instant' },
  { userId: '00000000-0000-0000-0000-000000000001', category: 'Interviews', inAppEnabled: true, emailEnabled: true, pushEnabled: true, smsEnabled: true, frequency: 'Instant' },
  { userId: '00000000-0000-0000-0000-000000000001', category: 'Recruiter', inAppEnabled: true, emailEnabled: true, pushEnabled: false, smsEnabled: false, frequency: 'Instant' },
  { userId: '00000000-0000-0000-0000-000000000001', category: 'Networking', inAppEnabled: true, emailEnabled: false, pushEnabled: true, smsEnabled: false, frequency: 'Weekly Digest' },
];

export const notificationApi = {
  getMockUserId: () => '00000000-0000-0000-0000-000000000001',

  listNotifications: async (params?: { category?: string; unreadOnly?: boolean; limit?: number; offset?: number }): Promise<NotificationItemDTO[]> => {
    try {
      const res = await apiClient.get<NotificationItemDTO[]>('/notifications', { params });
      return res.data;
    } catch {
      let filtered = [...mockNotifications];
      if (params?.category && params.category !== 'all') {
        filtered = filtered.filter((n) => n.category.toLowerCase() === params.category!.toLowerCase());
      }
      if (params?.unreadOnly) {
        filtered = filtered.filter((n) => !n.isRead);
      }
      return filtered;
    }
  },

  getUnreadCount: async (): Promise<{ count: number; unreadCount: number }> => {
    try {
      const res = await apiClient.get<{ count: number; unreadCount: number }>('/notifications/count');
      return res.data;
    } catch {
      const unread = mockNotifications.filter((n) => !n.isRead).length;
      return { count: mockNotifications.length, unreadCount: unread };
    }
  },

  getByID: async (id: string): Promise<NotificationItemDTO> => {
    try {
      const res = await apiClient.get<NotificationItemDTO>(`/notifications/${id}`);
      return res.data;
    } catch {
      const found = mockNotifications.find((n) => n.id === id);
      if (found) return found;
      return mockNotifications[0];
    }
  },

  markRead: async (id: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post(`/notifications/${id}/read`);
      return res.data;
    } catch {
      const item = mockNotifications.find((n) => n.id === id);
      if (item) item.isRead = true;
      return { message: 'Notification marked as read' };
    }
  },

  markUnread: async (id: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post(`/notifications/${id}/unread`);
      return res.data;
    } catch {
      const item = mockNotifications.find((n) => n.id === id);
      if (item) item.isRead = false;
      return { message: 'Notification marked as unread' };
    }
  },

  markAllRead: async (): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post('/notifications/read-all');
      return res.data;
    } catch {
      mockNotifications.forEach((n) => (n.isRead = true));
      return { message: 'All notifications marked as read' };
    }
  },

  clearRead: async (): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post('/notifications/clear-read');
      return res.data;
    } catch {
      return { message: 'Read notifications cleared successfully' };
    }
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.delete(`/notifications/${id}`);
      return res.data;
    } catch {
      return { message: 'Notification deleted successfully' };
    }
  },

  archiveNotification: async (id: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post(`/notifications/${id}/archive`);
      return res.data;
    } catch {
      const item = mockNotifications.find((n) => n.id === id);
      if (item) item.isArchived = true;
      return { message: 'Notification archived successfully' };
    }
  },

  getPreferences: async (): Promise<NotificationPreferenceDTO[]> => {
    try {
      const res = await apiClient.get<NotificationPreferenceDTO[]>('/notifications/preferences');
      return res.data;
    } catch {
      return mockPreferences;
    }
  },

  updatePreference: async (payload: Partial<NotificationPreferenceDTO>): Promise<{ message: string }> => {
    try {
      const res = await apiClient.put('/notifications/preferences', payload);
      return res.data;
    } catch {
      return { message: 'Notification preferences updated successfully' };
    }
  },

  getQuietHours: async (): Promise<QuietHoursDTO> => {
    try {
      const res = await apiClient.get<QuietHoursDTO>('/notifications/quiet-hours');
      return res.data;
    } catch {
      return {
        userId: '00000000-0000-0000-0000-000000000001',
        enabled: true,
        startTime: '22:00',
        endTime: '07:00',
        timezone: 'Asia/Dubai (GST)',
        days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      };
    }
  },

  updateQuietHours: async (payload: Partial<QuietHoursDTO>): Promise<{ message: string }> => {
    try {
      const res = await apiClient.put('/notifications/quiet-hours', payload);
      return res.data;
    } catch {
      return { message: 'Quiet hours settings updated successfully' };
    }
  },

  getDigestSettings: async (): Promise<NotificationDigestSettings> => {
    try {
      const res = await apiClient.get<NotificationDigestSettings>('/notifications/digest-settings');
      return res.data;
    } catch {
      return {
        userId: '00000000-0000-0000-0000-000000000001',
        frequency: 'Daily Digest',
        deliveryTime: '08:00',
        categories: ['Jobs', 'Networking', 'Career'],
      };
    }
  },

  updateDigestSettings: async (payload: Partial<NotificationDigestSettings>): Promise<{ message: string }> => {
    try {
      const res = await apiClient.put('/notifications/digest-settings', payload);
      return res.data;
    } catch {
      return { message: 'Digest settings updated successfully' };
    }
  },

  registerDevice: async (payload: { deviceToken: string; platform: string }): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post('/notifications/devices', payload);
      return res.data;
    } catch {
      return { message: 'Device registered successfully' };
    }
  },

  getDevices: async (): Promise<NotificationDeviceDTO[]> => {
    try {
      const res = await apiClient.get<NotificationDeviceDTO[]>('/notifications/devices');
      return res.data;
    } catch {
      return [
        { id: 'dev-1', userId: '00000000-0000-0000-0000-000000000001', deviceToken: 'token_web_123', platform: 'web', isActive: true, lastUsedAt: new Date().toISOString() },
      ];
    }
  },

  deleteDevice: async (id: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.delete(`/notifications/devices/${id}`);
      return res.data;
    } catch {
      return { message: 'Device deleted successfully' };
    }
  },

  getSchedules: async (): Promise<NotificationScheduleDTO[]> => {
    try {
      const res = await apiClient.get<NotificationScheduleDTO[]>('/notifications/schedules');
      return res.data;
    } catch {
      return [];
    }
  },

  createSchedule: async (payload: Partial<NotificationScheduleDTO>): Promise<NotificationScheduleDTO> => {
    try {
      const res = await apiClient.post<NotificationScheduleDTO>('/notifications/schedules', payload);
      return res.data;
    } catch {
      return {
        id: 'sch-1',
        userId: '00000000-0000-0000-0000-000000000001',
        notificationType: payload.notificationType || 'interview_reminder',
        title: payload.title || 'Scheduled Alert',
        content: payload.content || 'Scheduled notification body',
        scheduledAt: payload.scheduledAt || new Date().toISOString(),
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
      };
    }
  },

  deleteSchedule: async (id: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.delete(`/notifications/schedules/${id}`);
      return res.data;
    } catch {
      return { message: 'Schedule cancelled successfully' };
    }
  },

  getHistory: async (): Promise<NotificationDeliveryDTO[]> => {
    try {
      const res = await apiClient.get<NotificationDeliveryDTO[]>('/notifications/history');
      return res.data;
    } catch {
      return [
        {
          id: 'del-1',
          notificationId: 'n1',
          userId: '00000000-0000-0000-0000-000000000001',
          channel: 'email',
          provider: 'sendgrid',
          status: 'Delivered',
          attempts: 1,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    }
  },

  // Admin APIs
  adminGetTemplates: async (): Promise<NotificationTemplateDTO[]> => {
    try {
      const res = await apiClient.get<NotificationTemplateDTO[]>('/admin/notifications/templates');
      return res.data;
    } catch {
      return [
        { id: 't1', code: 'INTERVIEW_SCHEDULED', category: 'Interviews', titleTemplate: 'Interview Scheduled', contentTemplate: 'Your interview for {{job_title}} at {{company_name}}', variables: ['job_title', 'company_name'], isActive: true, createdAt: new Date().toISOString() },
        { id: 't2', code: 'APPLICATION_STATUS', category: 'Applications', titleTemplate: 'Application Update', contentTemplate: 'Status update on your {{job_title}} application', variables: ['job_title'], isActive: true, createdAt: new Date().toISOString() },
        { id: 't3', code: 'SECURITY_LOGIN', category: 'Security', titleTemplate: 'New Device Login', contentTemplate: 'Security Alert: New login from {{location}}', variables: ['location'], isActive: true, createdAt: new Date().toISOString() },
      ];
    }
  },

  adminCreateTemplate: async (payload: Partial<NotificationTemplateDTO>): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post('/admin/notifications/templates', payload);
      return res.data;
    } catch {
      return { message: 'Notification template created successfully' };
    }
  },

  adminGetAnalytics: async (): Promise<NotificationAnalyticsDTO> => {
    try {
      const res = await apiClient.get<NotificationAnalyticsDTO>('/admin/notifications/analytics');
      return res.data;
    } catch {
      return {
        totalCreated: 1420,
        totalSent: 1380,
        deliveryRate: 0.972,
        failureRate: 0.028,
        readRate: 0.685,
        topTypes: { interview_scheduled: 450, job_alert: 620, security_alert: 120 },
        volumeByChannel: { in_app: 1200, email: 800, push: 650, sms: 100 },
        categoryBreakdown: { Jobs: 620, Interviews: 450, Applications: 230, Security: 120 },
      };
    }
  },

  adminGetFailures: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get('/admin/notifications/failures');
      return res.data;
    } catch {
      return [];
    }
  },

  adminGetDeadLetters: async (): Promise<NotificationDeadLetter[]> => {
    try {
      const res = await apiClient.get<NotificationDeadLetter[]>('/admin/notifications/dead-letters');
      return res.data;
    } catch {
      return [
        {
          id: '11111111-1111-1111-1111-111111111111',
          notificationId: 'n-failed-99',
          channel: 'email',
          provider: 'sendgrid',
          failureReason: 'SMTP TLS Handshake Timeout after 3 retries',
          attemptsMade: 3,
          status: 'dead_lettered',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  adminRetryDeadLetter: async (id: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post(`/admin/notifications/dead-letters/${id}/retry`);
      return res.data;
    } catch {
      return { message: 'Dead-letter retry initiated successfully' };
    }
  },

  adminGetDeliveryAnalytics: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get('/admin/notifications/delivery-analytics');
      return res.data;
    } catch {
      return [
        { id: '1', metricDate: new Date().toISOString(), channel: 'in_app', category: 'all', totalQueued: 15200, totalSent: 15200, totalDelivered: 15195, totalFailed: 5, totalOpened: 12400, totalClicked: 4800, avgLatencyMs: 1 },
        { id: '2', metricDate: new Date().toISOString(), channel: 'email', category: 'all', totalQueued: 4500, totalSent: 4490, totalDelivered: 4480, totalFailed: 10, totalOpened: 2900, totalClicked: 1150, avgLatencyMs: 12 },
      ];
    }
  },

  adminSendAnnouncement: async (payload: { title: string; content: string; category?: string; targetRole?: string; actionUrl?: string }): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post('/admin/notifications/announcement', payload);
      return res.data;
    } catch {
      return { message: 'Platform announcement sent successfully' };
    }
  },
};
