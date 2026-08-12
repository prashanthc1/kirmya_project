import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminHeader from '../components/admin/AdminHeader';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import JobModeration from '../components/admin/JobModeration';
import TrustSafetyDashboard from '../components/admin/TrustSafetyDashboard';
import AuditLog from '../components/admin/AuditLog';
import SystemSettings from '../components/admin/SystemSettings';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/admin/dashboard',
}));

const theme = createTheme();

describe('Admin Module Component Tests', () => {
  it('renders Admin Header with RBAC indicator', () => {
    render(
      <ThemeProvider theme={theme}>
        <AdminHeader />
      </ThemeProvider>
    );
    expect(screen.getByText(/Kirmya Admin Control Center/i)).toBeInTheDocument();
    expect(screen.getByText(/RBAC ACTIVE/i)).toBeInTheDocument();
  });

  it('renders Admin Dashboard metrics overview', () => {
    render(
      <ThemeProvider theme={theme}>
        <AdminDashboard />
      </ThemeProvider>
    );
    expect(screen.getByText(/Platform Administrative Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Companies/i)).toBeInTheDocument();
  });

  it('renders User Account Governance management table', () => {
    render(
      <ThemeProvider theme={theme}>
        <UserManagement />
      </ThemeProvider>
    );
    expect(screen.getByText(/User Account Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/Tariq Al-Mansoor/i)).toBeInTheDocument();
  });

  it('renders Job Moderation Queue', () => {
    render(
      <ThemeProvider theme={theme}>
        <JobModeration />
      </ThemeProvider>
    );
    expect(screen.getByText(/Job Listing Moderation Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Senior Go Backend Architect/i)).toBeInTheDocument();
  });

  it('renders Trust & Safety Dashboard with explainable risk', () => {
    render(
      <ThemeProvider theme={theme}>
        <TrustSafetyDashboard />
      </ThemeProvider>
    );
    expect(screen.getByText(/Trust & Safety Control Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Explainable Risk Policy:/i)).toBeInTheDocument();
  });

  it('renders Immutable Audit Trail logs', () => {
    render(
      <ThemeProvider theme={theme}>
        <AuditLog />
      </ThemeProvider>
    );
    expect(screen.getByText(/Immutable Administrative Audit Trail/i)).toBeInTheDocument();
    expect(screen.getByText(/user.status_update/i)).toBeInTheDocument();
  });

  it('renders System Settings & Feature Flags', () => {
    render(
      <ThemeProvider theme={theme}>
        <SystemSettings />
      </ThemeProvider>
    );
    expect(screen.getByText(/Protected System Settings & Feature Flags/i)).toBeInTheDocument();
    expect(screen.getByText(/ai_moderation_v2/i)).toBeInTheDocument();
  });
});
