import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// The admin client used to answer from sample records compiled into it, so
// this suite proved the samples. It calls the API now, and the API is mocked
// here with those same records.
vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    id: 'u1',
  }),
}));

import { adminApi } from '../features/admin/services/adminApi';
import { authApiClient } from '../services/authService';
import {
  MOCK_IMPERSONATION_SESSIONS,
  MOCK_INCIDENTS,
  MOCK_JOBS,
  MOCK_MAINTENANCE,
} from './fixtures/admin';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import RoleManagement from '../components/admin/RoleManagement';
import JobModeration from '../components/admin/JobModeration';
import AuditLog from '../components/admin/AuditLog';
import FeatureFlagTable from '../components/admin/FeatureFlagTable';
import SystemSettings from '../components/admin/SystemSettings';
import AnnouncementEditor from '../components/admin/AnnouncementEditor';
import BackgroundJobManager from '../components/admin/BackgroundJobManager';
import IncidentManager from '../components/admin/IncidentManager';
import MaintenanceModeModal from '../components/admin/MaintenanceModeModal';
import ImpersonationDialog from '../components/admin/ImpersonationDialog';

const http = authApiClient as unknown as Record<
  'get' | 'post' | 'put' | 'patch' | 'delete',
  ReturnType<typeof vi.fn>
>;

const resolveWith = (payload: unknown) => ({ data: payload, status: 200 });

describe('Admin & Platform Administration Module Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    http.get.mockImplementation((url: string) => {
      if (url.includes('/background-jobs')) return Promise.resolve(resolveWith(MOCK_JOBS));
      if (url.includes('/incidents')) return Promise.resolve(resolveWith(MOCK_INCIDENTS));
      if (url.includes('/maintenance-mode')) return Promise.resolve(resolveWith(MOCK_MAINTENANCE));
      if (url.includes('/impersonate/sessions')) return Promise.resolve(resolveWith(MOCK_IMPERSONATION_SESSIONS));
      if (url.includes('/admin/dashboard')) {
        return Promise.resolve(
          resolveWith({
            totalUsers: 1200,
            activeUsers: 830,
            totalJobs: 240,
            pendingModeration: 4,
            totalApplications: 3100,
            openIncidents: 1,
            systemHealth: 'healthy',
          })
        );
      }
      return Promise.resolve(resolveWith([]));
    });
    http.post.mockResolvedValue(resolveWith({ success: true }));
    http.put.mockResolvedValue(resolveWith({}));
    http.patch.mockResolvedValue(resolveWith({}));
    http.delete.mockResolvedValue(resolveWith({ success: true }));
  });

  describe('API Client Methods (adminApi)', () => {
    it('fetches dashboard stats', async () => {
      const stats = await adminApi.getDashboardStats();
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.systemHealth).toBeDefined();
    });

    it('fetches and retries background jobs', async () => {
      const jobs = await adminApi.listBackgroundJobs();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);

      const retryRes = await adminApi.retryBackgroundJob('job-101');
      expect(retryRes.success).toBe(true);
    });

    it('manages platform incidents', async () => {
      const incidents = await adminApi.listIncidents();
      expect(Array.isArray(incidents)).toBe(true);

      http.post.mockResolvedValueOnce(
        resolveWith({ ...MOCK_INCIDENTS[0], id: 'inc-new', title: 'Test Incident Spikes' })
      );
      http.put.mockResolvedValueOnce(resolveWith({ ...MOCK_INCIDENTS[0], status: 'Resolved' }));
      const created = await adminApi.createIncident({
        title: 'Test Incident Spikes',
        description: 'Testing high load on cache cluster.',
        severity: 'Major',
      });
      expect(created.id).toBeDefined();
      expect(created.title).toBe('Test Incident Spikes');

      const updated = await adminApi.updateIncidentStatus(created.id, {
        status: 'Resolved',
        message: 'Fixed vector node capacity.',
      });
      expect(updated.status).toBe('Resolved');
    });

    it('fetches and updates maintenance mode configuration', async () => {
      const config = await adminApi.getMaintenanceModeConfig();
      expect(config.enabled).toBeDefined();

      http.put.mockResolvedValueOnce(resolveWith({ ...MOCK_MAINTENANCE, enabled: true, message: 'Maintenance active' }));
      const updated = await adminApi.updateMaintenanceModeConfig({ enabled: true, message: 'Maintenance active' });
      expect(updated.enabled).toBe(true);
      expect(updated.message).toBe('Maintenance active');
    });

    it('handles support impersonation requests and sessions', async () => {
      http.post.mockResolvedValueOnce(
        resolveWith({ ...MOCK_IMPERSONATION_SESSIONS[0], id: 'imp-new', targetUserId: 'u1' })
      );
      const session = await adminApi.requestSupportImpersonation({
        targetUserId: 'u1',
        reason: 'Testing support impersonation workflow',
        durationMinutes: 30,
      });
      expect(session.id).toBeDefined();
      expect(session.targetUserId).toBe('u1');

      const sessions = await adminApi.listImpersonationSessions();
      expect(sessions.length).toBeGreaterThan(0);

      const termRes = await adminApi.terminateImpersonationSession(session.id);
      expect(termRes.success).toBe(true);
    });
  });

  describe('Admin UI Components', () => {
    it('renders AdminDashboard with executive metrics and operations center', () => {
      render(<AdminDashboard />);
      expect(screen.getByText(/Platform Administrative Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
    });

    it('renders BackgroundJobManager with telemetry cards and job retry actions', async () => {
      render(<BackgroundJobManager />);
      expect(screen.getByText(/Background Job Manager & Queue Depth/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/email.bulk_notifications/i)).toBeInTheDocument();
      });
      const retryBtn = screen.getByRole('button', { name: /Retry Job/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
    });

    it('renders IncidentManager with platform incident tracking and timeline', async () => {
      render(<IncidentManager />);
      expect(screen.getByText(/Platform Incident Tracking & SLA Management/i)).toBeInTheDocument();
      await waitFor(() => {
        const matches = screen.getAllByText(/Intermittent Search Service Latency Spikes/i);
        expect(matches.length).toBeGreaterThan(0);
      });
      expect(screen.getByText(/Report Incident/i)).toBeInTheDocument();
    });

    it('renders MaintenanceModeModal when open and handles save', async () => {
      const handleClose = vi.fn();
      const handleSave = vi.fn();
      render(<MaintenanceModeModal open={true} onClose={handleClose} onSave={handleSave} />);
      expect(screen.getByText(/Platform Maintenance Mode Schedule/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Enable Maintenance Mode/i)).toBeInTheDocument();
      });
    });

    it('renders ImpersonationDialog with user target and compliance notice', () => {
      const handleClose = vi.fn();
      render(
        <ImpersonationDialog
          open={true}
          onClose={handleClose}
          targetUser={{ id: 'u1', name: 'Tariq Al-Mansoor', email: 'tariq@kirmya.com' }}
        />
      );
      expect(screen.getByText(/Support Account Impersonation/i)).toBeInTheDocument();
      expect(screen.getByText(/Immutable Compliance Audit Notice/i)).toBeInTheDocument();
      expect(screen.getByText(/Tariq Al-Mansoor/i)).toBeInTheDocument();
    });

    it('renders UserManagement governance table with impersonate action', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <UserManagement />
        </QueryClientProvider>
      );
      expect(screen.getByText(/User Account Governance/i)).toBeInTheDocument();
      // This asserted /Tariq Al-Mansoor/ - one of three accounts the console
      // held in component state and showed to every administrator on a platform
      // that has none of them. The directory is the API's now, so with the
      // network disabled there is nothing to list and the console says so.
      expect(screen.queryByText(/Tariq Al-Mansoor/i)).not.toBeInTheDocument();
    });

    it('renders RoleManagement without claiming roles it cannot name', () => {
      render(<RoleManagement />);
      expect(screen.getByText(/Administrative roles/i)).toBeInTheDocument();

      // Same correction as the user directory above: the role list was five
      // invented entries in component state, and Confirm set a success message
      // without calling anything. Both come from the server now.
      expect(screen.queryByText(/support_agent/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/analytics_viewer/i)).not.toBeInTheDocument();

      // The page states the rule that makes an assignment safe, because it is
      // the opposite of what "assign a role" usually implies.
      expect(screen.getByText(/holds every administrative permission/i)).toBeInTheDocument();
    });

    it('renders JobModeration queue', () => {
      render(<JobModeration />);
      expect(screen.getByText(/Job Listing Moderation Queue/i)).toBeInTheDocument();
    });

    it('renders AuditLog immutable records table', () => {
      render(<AuditLog />);
      expect(screen.getByText(/Administrative Audit Trail/i)).toBeInTheDocument();
    });

    it('renders FeatureFlagTable toggles', () => {
      render(<FeatureFlagTable />);
      expect(screen.getByText(/Feature Rollout Controls/i)).toBeInTheDocument();
    });

    it('renders SystemSettings configuration controls', () => {
      render(<SystemSettings />);
      expect(screen.getByText(/Protected System Settings/i)).toBeInTheDocument();
    });

    it('renders AnnouncementEditor composer', () => {
      render(<AnnouncementEditor />);
      expect(screen.getByText(/Platform Announcement Broadcast/i)).toBeInTheDocument();
    });
  });
});
