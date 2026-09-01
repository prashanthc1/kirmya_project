import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import SettingsHubPage from '../app/settings/page';
import SettingsSecurityPage from '../app/settings/security/page';
import SettingsPrivacyPage from '../app/settings/privacy/page';
import NotificationSettingsPage from '../app/settings/notifications/page';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
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

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'u1', email: 'alex.rivera@kirmya.com', name: 'Alex Rivera' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
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

describe('Settings, Privacy, Security & Account Management Experience (Prompt 28/50)', () => {
  const mockSecurityOverview = {
    user_id: 'u1',
    email_verified: true,
    mfa_enabled: true,
    active_sessions_count: 2,
    trusted_devices_count: 1,
    recent_security_events: 0,
    password_last_changed_at: '2026-08-01T12:00:00Z',
    security_score: 92,
    last_login_at: '2026-09-01T08:00:00Z',
    login_ip: '192.168.1.1',
  };

  const mockPrivacySettings = {
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    allow_search_discovery: true,
    allow_connection_requests: 'everyone',
    allow_direct_messages: 'connections_only',
    share_activity_updates: true,
    cookie_analytics: true,
    cookie_marketing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (authApiClient.get as any).mockImplementation((url: string) => {
      if (url.includes('/security/sessions')) {
        return Promise.resolve({
          data: [
            {
              id: 's-1',
              device: 'MacBook Pro',
              browser: 'Chrome 128',
              location: 'Dubai, UAE',
              ip_address: '192.168.1.1',
              is_current: true,
              last_active_at: '2026-09-01T08:30:00Z',
            },
          ],
        });
      }
      if (url.includes('/security')) {
        return Promise.resolve({ data: mockSecurityOverview });
      }
      if (url.includes('/privacy/settings')) {
        return Promise.resolve({ data: mockPrivacySettings });
      }
      if (url.includes('/privacy/requests')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/notifications/preferences')) {
        return Promise.resolve({
          data: [
            { category: 'Security', inAppEnabled: true, emailEnabled: true, pushEnabled: true, smsEnabled: true },
            { category: 'Jobs', inAppEnabled: true, emailEnabled: true, pushEnabled: true, smsEnabled: false },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    });

    (authApiClient.post as any).mockImplementation((url: string) => {
      return Promise.resolve({ data: { message: 'Success' } });
    });

    (authApiClient.put as any).mockImplementation((url: string) => {
      return Promise.resolve({ data: { message: 'Updated successfully' } });
    });

    (authApiClient.delete as any).mockImplementation((url: string) => {
      return Promise.resolve({ data: { message: 'Revoked successfully' } });
    });
  });

  describe('SettingsHubPage Component', () => {
    it('renders user summary and all settings navigation cards', () => {
      renderWithTheme(<SettingsHubPage />);

      expect(screen.getAllByText('Alex Rivera')[0]).toBeDefined();
      expect(screen.getAllByText('alex.rivera@kirmya.com')[0]).toBeDefined();
      expect(screen.getByText('Profile & Personal Information')).toBeDefined();
      expect(screen.getByText('Security & Authentication')).toBeDefined();
      expect(screen.getByText('Privacy & Data Subject Rights')).toBeDefined();
      expect(screen.getByText('Notifications & Alerts')).toBeDefined();
      expect(screen.getByText('Data & Privacy Management')).toBeDefined();
      expect(screen.getByText('Safety & Blocked Users')).toBeDefined();
      expect(screen.getByText('Billing & Subscriptions')).toBeDefined();
      expect(screen.getByText('Employer & Organization Settings')).toBeDefined();
    });
  });

  describe('SettingsSecurityPage & SecurityCenter', () => {
    it('renders security overview with score and password management tabs', async () => {
      renderWithTheme(<SettingsSecurityPage />);

      expect(screen.getByText(/Security & Identity Protection Center/i)).toBeDefined();
      expect(screen.getByRole('tab', { name: /Security Overview/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /Active Sessions/i })).toBeDefined();
      expect(screen.getByText(/Security Score Gauge/i)).toBeDefined();
    });
  });

  describe('SettingsPrivacyPage & UserPrivacySettings', () => {
    it('renders privacy toggles and data subject rights form', () => {
      renderWithTheme(<SettingsPrivacyPage />);

      expect(screen.getByText(/User Privacy & Data Subject Rights Hub/i)).toBeDefined();
      expect(screen.getByText(/Usage & Telemetry Analytics/i)).toBeDefined();
      expect(screen.getByText(/Marketing & Product Updates/i)).toBeDefined();
      expect(screen.getByText(/AI Model Recommendation Training/i)).toBeDefined();
      expect(screen.getByText(/Personalized Recommendations/i)).toBeDefined();
    });
  });

  describe('NotificationSettingsPage Component', () => {
    it('renders notification preferences', () => {
      renderWithTheme(<NotificationSettingsPage />);

      expect(screen.getByText(/Notification Preferences/i)).toBeDefined();
      expect(screen.getByText(/Security & Account Protection/i)).toBeDefined();
      expect(screen.getByText(/Job Alerts & Matches/i)).toBeDefined();
    });
  });
});
