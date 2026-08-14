import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SafetyCenter from '../components/safety/SafetyCenter';
import AccountRestrictions from '../components/safety/AccountRestrictions';
import ReportDialog from '../components/safety/ReportDialog';
import ReportList from '../components/safety/ReportList';
import ReportHistory from '../components/safety/ReportHistory';
import BlockList from '../components/safety/BlockList';
import BlockedUsers from '../components/safety/BlockedUsers';
import AppealForm from '../components/safety/AppealForm';
import AdminTrustSafetyDashboard from '../components/admin/trust-safety/AdminTrustSafetyDashboard';
import ModerationQueue from '../components/admin/trust-safety/ModerationQueue';
import AppealsManager from '../components/admin/trust-safety/AppealsManager';
import SafetyRulesManager from '../components/admin/trust-safety/SafetyRulesManager';

describe('Trust & Safety Control Module Test Suite', () => {
  it('renders SafetyCenter public trust hub with status and quick actions', () => {
    render(<SafetyCenter />);
    expect(screen.getByText(/Kirmya Trust & Safety Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Proactive Fraud Prevention/i)).toBeInTheDocument();
    expect(screen.getByText(/Server-Side Blocking/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Report Abuse or Fraud/i)[0]).toBeInTheDocument();
  });

  it('renders AccountRestrictions active restrictions component', () => {
    render(<AccountRestrictions />);
    expect(screen.getByText(/Account Status & Active Restrictions/i)).toBeInTheDocument();
  });

  it('renders ReportDialog when open', () => {
    render(<ReportDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/Submit Confidential Safety Report/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Target Entity Type/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Report Category \/ Violation Reason/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Keep Reporter Identity Confidential/i)).toBeInTheDocument();
  });

  it('renders ReportList user reports tracker', () => {
    render(<ReportList />);
    expect(screen.getByText(/My Submitted Reports/i)).toBeInTheDocument();
  });

  it('renders ReportHistory submitted reports page wrapper', () => {
    render(<ReportHistory />);
    expect(screen.getByText(/My Submitted Reports History/i)).toBeInTheDocument();
  });

  it('renders BlockList blocked accounts page wrapper', () => {
    render(<BlockList />);
    expect(screen.getByText(/Blocked Accounts Manager/i)).toBeInTheDocument();
  });

  it('renders BlockedUsers blocked accounts table', () => {
    render(<BlockedUsers />);
    expect(screen.getByText(/Blocked Accounts & Entities/i)).toBeInTheDocument();
  });

  it('renders AppealForm moderation decision appeal form', () => {
    render(<AppealForm />);
    expect(screen.getByText(/Submit Moderation Decision Appeal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Enforcement Decision Reference ID/i)[0]).toBeInTheDocument();
  });

  it('renders AdminTrustSafetyDashboard executive console', () => {
    render(<AdminTrustSafetyDashboard />);
    expect(screen.getByText(/Executive Trust & Safety Control Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Reports Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/High Risk Score Alerts/i)).toBeInTheDocument();
  });

  it('renders ModerationQueue admin moderation queue component', () => {
    render(<ModerationQueue />);
    expect(screen.getByText(/Interactive Moderation Queue/i)).toBeInTheDocument();
  });

  it('renders AppealsManager admin appeals console', () => {
    render(<AppealsManager />);
    expect(screen.getByText(/Moderation Appeals Review Console/i)).toBeInTheDocument();
  });

  it('renders SafetyRulesManager admin rules console', () => {
    render(<SafetyRulesManager />);
    expect(screen.getByText(/Automated Detection Safety Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Safety Rule/i)).toBeInTheDocument();
  });
});
