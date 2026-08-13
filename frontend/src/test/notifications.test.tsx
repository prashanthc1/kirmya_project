import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationBell from '../components/notifications/NotificationBell';
import NotificationPreferences from '../components/notifications/NotificationPreferences';
import QuietHours from '../components/notifications/QuietHours';
import NotificationCenter from '../components/notifications/NotificationCenter';
import AdminNotificationCenter from '../components/notifications/AdminNotificationCenter';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/notifications',
}));

const theme = createTheme();

describe('Notification & Communication Module Component Tests', () => {
  it('renders Notification Bell with badge', () => {
    render(
      <ThemeProvider theme={theme}>
        <NotificationBell />
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders Notification Center with filter tabs', () => {
    render(
      <ThemeProvider theme={theme}>
        <NotificationCenter />
      </ThemeProvider>
    );
    expect(screen.getByText(/Centralized Notification Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Channel Preferences/i)).toBeInTheDocument();
  });

  it('renders Notification Channel Preferences', () => {
    render(
      <ThemeProvider theme={theme}>
        <NotificationPreferences />
      </ThemeProvider>
    );
    expect(screen.getByText(/Communication Channel Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Security & Account Protection/i)).toBeInTheDocument();
  });

  it('renders Quiet Hours DND schedule configuration', () => {
    render(
      <ThemeProvider theme={theme}>
        <QuietHours />
      </ThemeProvider>
    );
    expect(screen.getByText(/Quiet Hours & Do-Not-Disturb Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Security Exception:/i)).toBeInTheDocument();
  });

  it('renders Admin Notification Control Console', () => {
    render(
      <ThemeProvider theme={theme}>
        <AdminNotificationCenter />
      </ThemeProvider>
    );
    expect(screen.getByText(/Admin Notification Control Console/i)).toBeInTheDocument();
  });
});
