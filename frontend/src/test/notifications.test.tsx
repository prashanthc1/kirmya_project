import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import NotificationBell from '../components/notifications/NotificationBell';
import NotificationCenter from '../components/notifications/NotificationCenter';
import AdminNotificationCenter from '../components/notifications/AdminNotificationCenter';

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
    expect(screen.getByText(/Admin Notification Command Center/i)).toBeInTheDocument();
    expect(screen.getByText(/System Announcements/i)).toBeInTheDocument();
  });
});
