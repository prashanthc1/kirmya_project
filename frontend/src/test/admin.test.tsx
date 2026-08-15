import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

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

describe('Admin & Platform Administration Module Test Suite', () => {
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

      const updated = await adminApi.updateMaintenanceModeConfig({ enabled: true, message: 'Maintenance active' });
      expect(updated.enabled).toBe(true);
      expect(updated.message).toBe('Maintenance active');
    });

    it('handles support impersonation requests and sessions', async () => {
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
      render(<UserManagement />);
      expect(screen.getByText(/User Account Governance/i)).toBeInTheDocument();
      expect(screen.getByText(/Tariq Al-Mansoor/i)).toBeInTheDocument();
      const impersonateBtns = screen.getAllByRole('button', { name: /Impersonate/i });
      expect(impersonateBtns.length).toBeGreaterThan(0);
    });

    it('renders RoleManagement RBAC console', () => {
      render(<RoleManagement />);
      expect(screen.getByText(/Role-Based Access Control/i)).toBeInTheDocument();
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
