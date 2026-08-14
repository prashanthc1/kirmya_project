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
  useParams: () => ({
    id: 'u1',
  }),
}));

import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import RoleManagement from '../components/admin/RoleManagement';
import JobModeration from '../components/admin/JobModeration';
import AuditLog from '../components/admin/AuditLog';
import FeatureFlagTable from '../components/admin/FeatureFlagTable';
import SystemSettings from '../components/admin/SystemSettings';
import AnnouncementEditor from '../components/admin/AnnouncementEditor';

describe('Admin & Platform Administration Module Test Suite', () => {
  it('renders AdminDashboard executive metrics', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/Platform Administrative Dashboard/i)).toBeInTheDocument();
  });

  it('renders UserManagement governance table', () => {
    render(<UserManagement />);
    expect(screen.getByText(/User Account Governance/i)).toBeInTheDocument();
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
