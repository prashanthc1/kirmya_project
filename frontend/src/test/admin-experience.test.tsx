import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import AdminMainPage from '../app/admin/page';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import RoleManagement from '../components/admin/RoleManagement';
import JobModeration from '../components/admin/JobModeration';
import AuditLog from '../components/admin/AuditLog';
import ModerationQueueTable from '../components/trust_safety/ModerationQueueTable';
import AppealsManagementDesk from '../components/trust_safety/AppealsManagementDesk';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/admin',
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
  getAccessToken: () => 'mock-admin-token',
}));

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'admin-1', email: 'admin@kirmya.com', name: 'Super Admin', role: 'super_admin' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
    authenticated: true,
    isAuthenticated: true,
    loading: false,
    permissions: ['admin.all', 'users.manage', 'moderation.manage'],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Admin, Moderation, Trust & Safety Experience (Prompt 29/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (authApiClient.get as any).mockImplementation((url: string) => {
      if (url.includes('/admin/stats') || url.includes('/admin/dashboard')) {
        return Promise.resolve({
          data: {
            totalUsers: 12450,
            activeJobs: 4850,
            pendingReports: 14,
            pendingVerifications: 28,
            systemHealth: 'healthy',
          },
        });
      }
      if (url.includes('/admin/users')) {
        return Promise.resolve({
          data: {
            users: [
              {
                id: 'u1',
                email: 'sarah.connor@example.com',
                first_name: 'Sarah',
                last_name: 'Connor',
                status: 'active',
                role: 'user',
                created_at: '2026-01-15T10:00:00Z',
              },
            ],
            total: 1,
          },
        });
      }
      if (url.includes('/admin/audit')) {
        return Promise.resolve({
          data: [
            {
              id: 'log-1',
              actor_email: 'admin@kirmya.com',
              action: 'user.suspend',
              entity_id: 'u2',
              timestamp: '2026-09-01T08:00:00Z',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    (authApiClient.post as any).mockImplementation(() => Promise.resolve({ data: { success: true } }));
    (authApiClient.put as any).mockImplementation(() => Promise.resolve({ data: { success: true } }));
    (authApiClient.delete as any).mockImplementation(() => Promise.resolve({ data: { success: true } }));
  });

  describe('AdminMainPage & AdminDashboard', () => {
    it('renders platform admin dashboard with operations metrics and actions', () => {
      renderWithTheme(<AdminMainPage />);

      expect(screen.getByText(/Platform Administrative Dashboard/i)).toBeDefined();
      expect(screen.getByText(/Maintenance Mode/i)).toBeDefined();
      expect(screen.getByText(/Impersonate/i)).toBeDefined();
      expect(screen.getByText(/Open Queue/i)).toBeDefined();
    });
  });

  describe('UserManagement & RoleManagement', () => {
    it('renders user management console', () => {
      renderWithTheme(<UserManagement />);

      expect(screen.getByText(/User Account Governance/i)).toBeDefined();
    });

    it('renders administrative role matrix', () => {
      renderWithTheme(<RoleManagement />);

      expect(screen.getByText(/Role-Based Access Control/i)).toBeDefined();
    });
  });

  describe('JobModeration & AuditLog', () => {
    it('renders job moderation desk', () => {
      renderWithTheme(<JobModeration />);

      expect(screen.getByText(/Job Listing Moderation Queue/i)).toBeDefined();
    });

    it('renders security audit log', () => {
      renderWithTheme(<AuditLog />);

      expect(screen.getByText(/Immutable Administrative Audit Trail/i)).toBeDefined();
    });
  });

  describe('ModerationQueueTable & AppealsDesk', () => {
    it('renders interactive moderation queue table', async () => {
      renderWithTheme(<ModerationQueueTable />);

      expect(await screen.findByText(/Interactive Moderation Queue/i)).toBeDefined();
    });

    it('renders appeals management desk', () => {
      renderWithTheme(<AppealsManagementDesk />);

      expect(screen.getByText(/User Appeals Review Desk/i)).toBeDefined();
    });
  });
});
