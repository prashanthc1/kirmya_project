import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
import AdminNotificationCenter from '../components/notifications/AdminNotificationCenter';
import { notificationApi } from '../features/notifications/services/notificationApi';

describe('Notifications & Real-Time Alerts Module Test Suite', () => {
  it('renders NotificationBell button', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders NotificationCenter tabs and feed header', () => {
    render(<NotificationCenter />);
    expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    expect(screen.getByText(/All Feed/i)).toBeInTheDocument();
    expect(screen.getByText(/Channel Preferences/i)).toBeInTheDocument();
  });

  it('renders AdminNotificationCenter control panel', () => {
    render(<AdminNotificationCenter />);
    expect(screen.getByText(/Admin Notification Control Console/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Broadcast System Announcement/i).length).toBeGreaterThan(0);
  });

  it('fetches dead letters and triggers retry safely', async () => {
    const deadLetters = await notificationApi.adminGetDeadLetters();
    expect(deadLetters.length).toBeGreaterThan(0);

    const retryRes = await notificationApi.adminRetryDeadLetter(deadLetters[0].id);
    expect(retryRes.message).toContain('initiated successfully');
  });
});
