import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SecurityCenter from '../components/security/SecurityCenter';
import SessionManagerView from '../components/security/SessionManagerView';
import DeviceManagerView from '../components/security/DeviceManagerView';
import AdminSecurityDashboard from '../components/security/AdminSecurityDashboard';

describe('Security & Identity Protection Components Test Suite', () => {
  it('renders SecurityCenter with full tabbed controls', () => {
    render(<SecurityCenter />);
    expect(screen.getByText(/Security & Identity Protection Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Security Score/i)).toBeInTheDocument();
    expect(screen.getByText(/MFA Protection/i)).toBeInTheDocument();
  });

  it('renders SessionManagerView with active sessions', () => {
    render(<SessionManagerView />);
    expect(screen.getByText(/Active Authentication Sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/Chrome 120 / Windows 11/i)).toBeInTheDocument();
  });

  it('renders DeviceManagerView with registered trusted devices', () => {
    render(<DeviceManagerView />);
    expect(screen.getByText(/Trusted Browsers & Registered Devices/i)).toBeInTheDocument();
    expect(screen.getByText(/Web Desktop/i)).toBeInTheDocument();
  });

  it('renders AdminSecurityDashboard executive console', () => {
    render(<AdminSecurityDashboard />);
    expect(screen.getByText(/Executive Security & Incident Control Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed Logins \(24h\)/i)).toBeInTheDocument();
    expect(screen.getByText(/MFA Adoption Rate/i)).toBeInTheDocument();
  });
});
