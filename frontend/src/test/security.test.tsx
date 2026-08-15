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
  useParams: () => ({
    id: 'inc-1',
  }),
}));

import SecurityCenter from '../components/security/SecurityCenter';
import SessionManagerView from '../components/security/SessionManagerView';
import DeviceManagerView from '../components/security/DeviceManagerView';
import LoginHistoryView from '../components/security/LoginHistoryView';
import MFASetupDialog from '../components/security/MFASetupDialog';
import APIKeyManagerDialog from '../components/security/APIKeyManagerDialog';
import AdminSecurityDashboard from '../components/security/AdminSecurityDashboard';

describe('Security Hardening & Protection Module Test Suite', () => {
  it('renders SecurityCenter settings dashboard with security score', async () => {
    render(<SecurityCenter />);
    expect(screen.getAllByText(/Security/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Security Score Gauge/i)).toBeInTheDocument();
  });

  it('renders SessionManagerView active sessions list and triggers revoke', async () => {
    render(<SessionManagerView />);
    expect(screen.getByText(/Active Authentication Sessions/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Chrome 120.0 \/ Windows 11/i)).toBeInTheDocument();
    });
  });

  it('renders DeviceManagerView trusted devices with trust toggle', async () => {
    render(<DeviceManagerView />);
    await waitFor(() => {
      expect(screen.getAllByText(/Trusted/i).length).toBeGreaterThan(0);
    });
  });

  it('renders LoginHistoryView security event log timeline', async () => {
    render(<LoginHistoryView />);
    expect(screen.getByText(/Login Security & Audit Event Timeline/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/login.success/i)).toBeInTheDocument();
    });
  });

  it('renders MFASetupDialog setup workflow and steps', () => {
    render(<MFASetupDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/Two-Factor Authentication Setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan Authenticator QR Code/i)).toBeInTheDocument();
  });

  it('renders APIKeyManagerDialog key generator with scopes', () => {
    render(<APIKeyManagerDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/Create New Scoped API Key/i)).toBeInTheDocument();
    expect(screen.getByText(/profile.read/i)).toBeInTheDocument();
  });

  it('renders AdminSecurityDashboard executive security console and threat monitor', async () => {
    render(<AdminSecurityDashboard />);
    expect(screen.getByText(/Executive Security & Threat Monitor Console/i)).toBeInTheDocument();
    expect(screen.getByText(/Threat Level Normal/i)).toBeInTheDocument();
  });
});
