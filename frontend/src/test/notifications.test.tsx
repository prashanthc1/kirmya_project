import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { NotificationBell } from '../components/notifications/NotificationBell';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { NotificationList } from '../components/notifications/NotificationList';
import { NotificationPreferences } from '../components/notifications/NotificationPreferences';
import { notificationApi } from '../features/notifications/services/notificationApi';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/notifications',
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getAccessToken: () => 'mock-jwt-token',
}));

const mockSetNotificationsCount = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'u1', email: 'test@kirmya.com', name: 'Test User' },
    notificationsCount: 3,
    setNotificationsCount: mockSetNotificationsCount,
    authenticated: true,
    isAuthenticated: true,
    loading: false,
    permissions: [],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Notifications, Activity Center & Notification Preferences (Prompt 21/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotificationItem Component', () => {
    const mockNotification = {
      id: 'notif-1',
      userId: 'u1',
      category: 'Security' as const,
      type: 'security_alert',
      priority: 'Critical' as const,
      title: 'New Login Detected',
      content: 'Successful login from Chrome on macOS (Dubai, UAE).',
      actorName: 'Security Engine',
      actionUrl: '/settings/security',
      isRead: false,
      isArchived: false,
      createdAt: '2026-08-30T15:00:00Z',
    };

    it('renders notification title, content, actor, and critical badge', () => {
      renderWithTheme(<NotificationItem item={mockNotification} />);
      expect(screen.getByText('New Login Detected')).toBeDefined();
      expect(screen.getByText(/Successful login from Chrome on macOS/i)).toBeDefined();
      expect(screen.getByText('Security Engine')).toBeDefined();
      expect(screen.getByText('Critical')).toBeDefined();
    });

    it('navigates to action URL and marks as read on click', () => {
      const mockMarkRead = vi.fn();
      renderWithTheme(<NotificationItem item={mockNotification} onMarkRead={mockMarkRead} />);

      const card = screen.getByText('New Login Detected').closest('div');
      if (card) fireEvent.click(card);

      expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
      expect(mockPush).toHaveBeenCalledWith('/settings/security');
    });
  });

  describe('NotificationList Component', () => {
    const mockList = [
      {
        id: 'n1',
        userId: 'u1',
        category: 'Jobs' as const,
        type: 'job_match',
        priority: 'Normal' as const,
        title: 'New Job Match',
        content: 'Lead Go Engineer position matches your profile.',
        actionUrl: '/jobs/123',
        isRead: false,
        isArchived: false,
        createdAt: '2026-08-30T12:00:00Z',
      },
      {
        id: 'n2',
        userId: 'u1',
        category: 'Networking' as const,
        type: 'connection_request',
        priority: 'Normal' as const,
        title: 'Connection Request',
        content: 'Fatima Al-Nuaimi sent you a connection request.',
        actionUrl: '/network/requests',
        isRead: true,
        isArchived: false,
        createdAt: '2026-08-29T10:00:00Z',
      },
    ];

    it('renders list items and unread count header', () => {
      renderWithTheme(<NotificationList notifications={mockList} />);
      expect(screen.getByText('New Job Match')).toBeDefined();
      expect(screen.getByText('Connection Request')).toBeDefined();
      expect(screen.getByText(/1 UNREAD NOTIFICATION/i)).toBeDefined();
    });

    it('renders empty state when list is empty', () => {
      renderWithTheme(<NotificationList notifications={[]} />);
      expect(screen.getByText(/You're all caught up!/i)).toBeDefined();
    });
  });

  describe('NotificationCenter Component', () => {
    it('renders header, category tabs, and calls listNotifications API', async () => {
      const mockData = [
        {
          id: 'n10',
          userId: 'u1',
          category: 'Jobs' as const,
          type: 'job_alert',
          priority: 'Normal' as const,
          title: 'Senior Architect Role',
          content: 'New job posted in Dubai.',
          actionUrl: '/jobs',
          isRead: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
      ];

      (authApiClient.get as any).mockImplementation((url: string) => {
        if (url === '/notifications/unread-count') {
          return Promise.resolve({ data: { unreadCount: 1, count: 1 } });
        }
        return Promise.resolve({ data: mockData });
      });

      renderWithTheme(<NotificationCenter />);

      expect(screen.getByText('Notifications')).toBeDefined();
      expect(screen.getByText('All')).toBeDefined();
      expect(screen.getByText('Unread')).toBeDefined();
      expect(screen.getByText('Jobs')).toBeDefined();

      await waitFor(() => {
        expect(screen.getByText('Senior Architect Role')).toBeDefined();
      });
    });

    it('handles Mark All Read click and updates state', async () => {
      (authApiClient.get as any).mockImplementation((url: string) => {
        if (url === '/notifications/unread-count') {
          return Promise.resolve({ data: { unreadCount: 0, count: 0 } });
        }
        return Promise.resolve({ data: [] });
      });
      (authApiClient.post as any).mockResolvedValueOnce({ data: { message: 'All marked read' } });

      renderWithTheme(<NotificationCenter />);

      const markAllBtn = screen.getByRole('button', { name: /Mark all read/i });
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(authApiClient.post).toHaveBeenCalledWith('/notifications/read-all');
        expect(mockSetNotificationsCount).toHaveBeenCalledWith(0);
      });
    });
  });

  describe('NotificationBell Component', () => {
    it('renders bell button with unread count badge and opens popover', async () => {
      (authApiClient.get as any).mockImplementation((url: string) => {
        if (url === '/notifications/unread-count') {
          return Promise.resolve({ data: { unreadCount: 3, count: 3 } });
        }
        return Promise.resolve({
          data: [
            {
              id: 'n-bell-1',
              userId: 'u1',
              category: 'Messaging' as const,
              type: 'chat_message',
              priority: 'Normal' as const,
              title: 'New message from Salim',
              content: 'Let us connect tomorrow.',
              actionUrl: '/messages',
              isRead: false,
              isArchived: false,
              createdAt: new Date().toISOString(),
            },
          ],
        });
      });

      renderWithTheme(<NotificationBell />);

      const bellBtn = screen.getByRole('button', { name: /Open notifications menu/i });
      expect(bellBtn).toBeDefined();

      fireEvent.click(bellBtn);

      await waitFor(() => {
        expect(screen.getByText(/New message from Salim/i)).toBeDefined();
        expect(screen.getByText(/View all notifications/i)).toBeDefined();
      });
    });
  });

  describe('NotificationPreferences Component', () => {
    it('renders channel preferences matrix and quiet hours schedule', async () => {
      (authApiClient.get as any).mockImplementation((url: string) => {
        if (url === '/notifications/preferences') {
          return Promise.resolve({
            data: [
              {
                category: 'Jobs',
                inAppEnabled: true,
                emailEnabled: true,
                pushEnabled: false,
                smsEnabled: false,
              },
            ],
          });
        }
        if (url === '/notifications/quiet-hours') {
          return Promise.resolve({
            data: {
              enabled: true,
              startTime: '22:00',
              endTime: '07:00',
              timezone: 'Asia/Dubai (GST)',
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithTheme(<NotificationPreferences />);

      expect(screen.getByText('Notification Preferences')).toBeDefined();
      expect(screen.getByText('Security & Account Protection')).toBeDefined();
      expect(screen.getByText('Job Alerts & Matches')).toBeDefined();
      expect(screen.getByText(/Do Not Disturb & Quiet Hours/i)).toBeDefined();

      await waitFor(() => {
        expect(authApiClient.get).toHaveBeenCalledWith('/notifications/preferences');
      });
    });
  });

  describe('notificationApi Methods', () => {
    it('listNotifications calls GET /notifications with params', async () => {
      const mockResult = [{ id: 'n1' }];
      (authApiClient.get as any).mockResolvedValueOnce({ data: mockResult });

      const res = await notificationApi.listNotifications({ category: 'Jobs', unreadOnly: true });
      expect(authApiClient.get).toHaveBeenCalledWith('/notifications', {
        params: { category: 'Jobs', unreadOnly: true },
      });
      expect(res).toEqual(mockResult);
    });

    it('getUnreadCount calls GET /notifications/unread-count', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({ data: { count: 4, unreadCount: 4 } });

      const res = await notificationApi.getUnreadCount();
      expect(authApiClient.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(res.unreadCount).toBe(4);
    });

    it('markRead calls POST /notifications/:id/read', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: { message: 'read' } });

      const res = await notificationApi.markRead('n1');
      expect(authApiClient.post).toHaveBeenCalledWith('/notifications/n1/read');
      expect(res.message).toBe('read');
    });

    it('markAllRead calls POST /notifications/read-all', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: { message: 'all read' } });

      const res = await notificationApi.markAllRead();
      expect(authApiClient.post).toHaveBeenCalledWith('/notifications/read-all');
      expect(res.message).toBe('all read');
    });
  });
});
