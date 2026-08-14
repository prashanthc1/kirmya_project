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
    id: 'inc-1',
  }),
}));

import SecurityCenter from '../components/security/SecurityCenter';
import SessionManagerView from '../components/security/SessionManagerView';
import DeviceManagerView from '../components/security/DeviceManagerView';
import MFASetupDialog from '../components/security/MFASetupDialog';
import APIKeyManagerDialog from '../components/security/APIKeyManagerDialog';
import AdminSecurityDashboard from '../components/security/AdminSecurityDashboard';

describe('Security Hardening & Protection Module Test Suite', () => {
  it('renders SecurityCenter settings dashboard', () => {
    render(<SecurityCenter />);
    expect(screen.getAllByText(/Security/i).length).toBeGreaterThan(0);
  });

  it('renders SessionManagerView active sessions list', () => {
    render(<SessionManagerView />);
    expect(screen.getByText(/Active Authentication Sessions/i)).toBeInTheDocument();
  });

  it('renders DeviceManagerView trusted devices', () => {
    render(<DeviceManagerView />);
    expect(screen.getAllByText(/Trusted/i).length).toBeGreaterThan(0);
  });

  it('renders MFASetupDialog setup workflow', () => {
    render(<MFASetupDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
  });

  it('renders APIKeyManagerDialog key generator', () => {
    render(<APIKeyManagerDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/Create New Scoped API Key/i)).toBeInTheDocument();
  });

  it('renders AdminSecurityDashboard executive security console', () => {
    render(<AdminSecurityDashboard />);
    expect(screen.getByText(/Executive Security/i)).toBeInTheDocument();
  });
});
