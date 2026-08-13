import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SafetyCenter from '../components/safety/SafetyCenter';
import ReportList from '../components/safety/ReportList';
import BlockedUsers from '../components/safety/BlockedUsers';
import AppealForm from '../components/safety/AppealForm';
import AdminTrustSafetyDashboard from '../components/admin/trust-safety/AdminTrustSafetyDashboard';

describe('Trust & Safety Control Module Test Suite', () => {
  it('renders SafetyCenter public trust hub', () => {
    render(<SafetyCenter />);
    expect(screen.getByText(/Kirmya Trust & Safety Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Proactive Fraud Prevention/i)).toBeInTheDocument();
    expect(screen.getByText(/Server-Side Blocking/i)).toBeInTheDocument();
  });

  it('renders ReportList user reports tracker', () => {
    render(<ReportList />);
    expect(screen.getByText(/My Submitted Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote Senior Data Engineer/i)).toBeInTheDocument();
  });

  it('renders BlockedUsers blocked accounts manager', () => {
    render(<BlockedUsers />);
    expect(screen.getByText(/Blocked Accounts & Entities/i)).toBeInTheDocument();
    expect(screen.getByText(/Suspicious Recruiter Account/i)).toBeInTheDocument();
  });

  it('renders AppealForm moderation appeal form', () => {
    render(<AppealForm />);
    expect(screen.getByText(/Submit Moderation Decision Appeal/i)).toBeInTheDocument();
  });

  it('renders AdminTrustSafetyDashboard executive console', () => {
    render(<AdminTrustSafetyDashboard />);
    expect(screen.getByText(/Executive Trust & Safety Control Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Appeals/i)).toBeInTheDocument();
  });
});
