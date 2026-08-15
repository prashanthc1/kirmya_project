import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

import NotificationBell from '../components/notifications/NotificationBell';
import NotificationCenter from '../components/notifications/NotificationCenter';
import NotificationItem from '../components/notifications/NotificationItem';
import NotificationPreferences from '../components/notifications/NotificationPreferences';
import QuietHours from '../components/notifications/QuietHours';
import DigestSettings from '../components/notifications/DigestSettings';
import AdminNotificationCenter from '../components/notifications/AdminNotificationCenter';
import { notificationApi } from '../features/notifications/services/notificationApi';

import NotificationsMainPage from '../app/notifications/page';
import AllNotificationsPage from '../app/notifications/all/page';
import UnreadNotificationsPage from '../app/notifications/unread/page';
import JobsNotificationsSubPage from '../app/notifications/jobs/page';
import ApplicationsNotificationsSubPage from '../app/notifications/applications/page';
import NetworkNotificationsSubPage from '../app/notifications/network/page';
import MessagesNotificationsSubPage from '../app/notifications/messages/page';
import InterviewsNotificationsSubPage from '../app/notifications/interviews/page';
import CareerNotificationsSubPage from '../app/notifications/career/page';

describe('Notifications & Real-Time Alerts Module Test Suite', () => {
  describe('API Service Layer Tests', () => {
    it('fetches notification list and unread count', async () => {
      const list = await notificationApi.listNotifications();
      expect(list.length).toBeGreaterThan(0);

      const unreadCount = await notificationApi.getUnreadCount();
      expect(unreadCount).toHaveProperty('unreadCount');
    });

    it('marks notification as read and unread', async () => {
      const markReadRes = await notificationApi.markRead('n1');
      expect(markReadRes.message).toBeDefined();

      const markUnreadRes = await notificationApi.markUnread('n1');
      expect(markUnreadRes.message).toBeDefined();
    });

    it('fetches preferences and updates preference', async () => {
      const prefs = await notificationApi.getPreferences();
      expect(prefs.length).toBeGreaterThan(0);

      const updateRes = await notificationApi.updatePreference({ category: 'Jobs', emailEnabled: true });
      expect(updateRes.message).toContain('updated');
    });

    it('fetches and updates quiet hours settings', async () => {
      const quietHours = await notificationApi.getQuietHours();
      expect(quietHours).toHaveProperty('enabled');

      const updateRes = await notificationApi.updateQuietHours({ enabled: true, startTime: '23:00' });
      expect(updateRes.message).toContain('updated');
    });

    it('fetches and updates digest settings', async () => {
      const digest = await notificationApi.getDigestSettings();
      expect(digest).toHaveProperty('frequency');

      const updateRes = await notificationApi.updateDigestSettings({ frequency: 'Daily Digest' });
      expect(updateRes.message).toContain('updated');
    });

    it('fetches dead letters and triggers retry safely', async () => {
      const deadLetters = await notificationApi.adminGetDeadLetters();
      expect(deadLetters.length).toBeGreaterThan(0);

      const retryRes = await notificationApi.adminRetryDeadLetter(deadLetters[0].id);
      expect(retryRes.message).toContain('initiated successfully');
    });

    it('sends admin broadcast announcement', async () => {
      const announceRes = await notificationApi.adminSendAnnouncement({
        title: 'System Update',
        content: 'Scheduled downtime tonight.',
      });
      expect(announceRes.message).toContain('sent successfully');
    });
  });

  describe('Notification Components Tests', () => {
    it('renders NotificationBell button and opens popover on click', () => {
      render(<NotificationBell />);
      const bellBtn = screen.getByRole('button');
      expect(bellBtn).toBeInTheDocument();

      fireEvent.click(bellBtn);
      expect(screen.getByText(/View All Notifications/i)).toBeInTheDocument();
    });

    it('renders NotificationCenter tabs and feed header', async () => {
      render(<NotificationCenter />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
      expect(screen.getByText(/All Feed/i)).toBeInTheDocument();
      expect(screen.getByText(/Channel Preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Quiet Hours/i)).toBeInTheDocument();
      expect(screen.getByText(/Digest & History/i)).toBeInTheDocument();
    });

    it('switches tabs in NotificationCenter', () => {
      render(<NotificationCenter />);
      const prefsTab = screen.getByRole('tab', { name: /Channel Preferences/i });
      fireEvent.click(prefsTab);
      expect(screen.getByText(/Communication Channel Preferences/i)).toBeInTheDocument();

      const quietTab = screen.getByRole('tab', { name: /Quiet Hours/i });
      fireEvent.click(quietTab);
      expect(screen.getByText(/Quiet Hours & Do-Not-Disturb Schedule/i)).toBeInTheDocument();
    });

    it('renders NotificationItem with priority chip and actor name', () => {
      const mockItem = {
        id: 'n-test',
        userId: 'u1',
        category: 'Interviews' as const,
        type: 'interview_scheduled',
        priority: 'Critical' as const,
        title: 'System Security Alert',
        content: 'Unusual login pattern detected.',
        actorName: 'Security Bot',
        isRead: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
      };

      render(<NotificationItem item={mockItem} />);
      expect(screen.getByText('System Security Alert')).toBeInTheDocument();
      expect(screen.getByText('Security Bot')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });

    it('renders NotificationPreferences matrix', () => {
      render(<NotificationPreferences />);
      expect(screen.getByText(/Communication Channel Preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Security & Account Protection/i)).toBeInTheDocument();
      expect(screen.getByText(/Job Alerts & Matches/i)).toBeInTheDocument();
    });

    it('renders QuietHours configuration card', () => {
      render(<QuietHours />);
      expect(screen.getByText(/Quiet Hours & Do-Not-Disturb Schedule/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Quiet Hours/i)).toBeInTheDocument();
    });

    it('renders DigestSettings card', () => {
      render(<DigestSettings />);
      expect(screen.getByText(/Notification Email Digest Summaries/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Digest Settings/i)).toBeInTheDocument();
    });

    it('renders AdminNotificationCenter control panel and dead letter queue', async () => {
      render(<AdminNotificationCenter />);
      expect(screen.getByText(/Admin Notification Control Console/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Broadcast System Announcement/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Dead Letter Queue Management/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/SMTP TLS Handshake Timeout/i)).toBeInTheDocument();
      });
    });
  });

  describe('App Router Notifications Subpages', () => {
    it('renders NotificationsMainPage (/notifications)', () => {
      render(<NotificationsMainPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders AllNotificationsPage (/notifications/all)', () => {
      render(<AllNotificationsPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders UnreadNotificationsPage (/notifications/unread)', () => {
      render(<UnreadNotificationsPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders JobsNotificationsSubPage (/notifications/jobs)', () => {
      render(<JobsNotificationsSubPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders ApplicationsNotificationsSubPage (/notifications/applications)', () => {
      render(<ApplicationsNotificationsSubPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders NetworkNotificationsSubPage (/notifications/network)', () => {
      render(<NetworkNotificationsSubPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders MessagesNotificationsSubPage (/notifications/messages)', () => {
      render(<MessagesNotificationsSubPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders InterviewsNotificationsSubPage (/notifications/interviews)', () => {
      render(<InterviewsNotificationsSubPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });

    it('renders CareerNotificationsSubPage (/notifications/career)', () => {
      render(<CareerNotificationsSubPage />);
      expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    });
  });
});
