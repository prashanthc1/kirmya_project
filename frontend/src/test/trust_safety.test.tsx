import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// API Client
import { trustSafetyApi } from '../features/trust_safety/services/trustSafetyApi';

// Glassmorphic MUI v6 Components
import ModerationQueueTable from '../components/trust_safety/ModerationQueueTable';
import CaseInvestigationDrawer from '../components/trust_safety/CaseInvestigationDrawer';
import AppealsManagementDesk from '../components/trust_safety/AppealsManagementDesk';
import SafetyPolicyStudio from '../components/trust_safety/SafetyPolicyStudio';
import ModeratorWorkloadCard from '../components/trust_safety/ModeratorWorkloadCard';
import UserSafetyCenter from '../components/trust_safety/UserSafetyCenter';

// Legacy & Supporting Components
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

// App Router Pages
import AdminTrustSafetyDashboardPage from '../app/admin/trust-safety/page';
import AdminQueuePage from '../app/admin/trust-safety/queue/page';
import AdminAppealsPage from '../app/admin/trust-safety/appeals/page';
import AdminPoliciesPage from '../app/admin/trust-safety/policies/page';
import SafetyHubPage from '../app/safety/page';
import UserSettingsAppealsPage from '../app/settings/trust-safety/appeals/page';

describe('Trust & Safety API Client Suite', () => {
  /*
   * These asserted the fixtures the client returned when its request failed:
   * a case with a risk_score, a claim that came back "claimed", a policy
   * matrix. None of it came from the API - the suite disables the network, so
   * every one of those calls failed and the catch block answered.
   *
   * A moderation console that reports a case as claimed when the claim did not
   * reach the server is worse than one that reports an error, so the fallbacks
   * are gone. What these now pin is that the failure is reported.
   */
  it('report a failed request rather than answering with invented data', async () => {
    await expect(trustSafetyApi.getSafetyCases()).rejects.toThrow();
    await expect(trustSafetyApi.claimCase('case-101')).rejects.toThrow();
    await expect(
      trustSafetyApi.assignCase('case-101', 'mod-tier2', 'tier-2-moderation')
    ).rejects.toThrow();
    await expect(trustSafetyApi.getSafetyPolicies()).rejects.toThrow();
    await expect(trustSafetyApi.getSafetyMetrics()).rejects.toThrow();
  });
});

describe('Trust & Safety Glassmorphic MUI v6 Components Suite', () => {
  it('renders ModerationQueueTable component with title and table columns', async () => {
    render(<ModerationQueueTable />);
    expect(await screen.findByText(/Interactive Moderation Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Cases Pending/i)).toBeInTheDocument();
  });

  it('renders CaseInvestigationDrawer when opened with caseItem', () => {
    const sampleCase = {
      id: 'case-101',
      case_number: 'CASE-2026-0801',
      target_type: 'job',
      target_id: 'job-999',
      target_title: 'Remote Senior Data Engineer',
      category: 'fake_job',
      priority: 'urgent' as const,
      risk_score: 92,
      status: 'open' as const,
      created_at: new Date().toISOString(),
    };

    render(<CaseInvestigationDrawer open={true} onClose={() => {}} caseItem={sampleCase} />);
    expect(screen.getByText(/CASE INVESTIGATION DESK/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote Senior Data Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/ENFORCEMENT ACTION FORM/i)).toBeInTheDocument();
  });

  it('renders AppealsManagementDesk component with metrics overview', async () => {
    render(<AppealsManagementDesk />);
    expect(await screen.findByText(/User Appeals Review Desk/i)).toBeInTheDocument();
    expect(screen.getByText(/PENDING APPEALS/i)).toBeInTheDocument();
    expect(screen.getByText(/APPROVED APPEALS/i)).toBeInTheDocument();
  });

  it('renders SafetyPolicyStudio component with policy tabs', async () => {
    render(<SafetyPolicyStudio />);
    expect(await screen.findByText(/Platform Safety Policy Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Safety Policy/i)).toBeInTheDocument();
  });

  it('renders ModeratorWorkloadCard component with metrics', async () => {
    render(<ModeratorWorkloadCard />);
    expect(await screen.findByText(/Moderator Workload & SLA Metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE CASES ASSIGNED/i)).toBeInTheDocument();
  });

  it('renders UserSafetyCenter public hub with community guidelines', async () => {
    render(<UserSafetyCenter />);
    expect(await screen.findByText(/Proactive Fraud Prevention & Platform Integrity/i)).toBeInTheDocument();
    expect(screen.getByText(/Report Abuse or Fraud/i)).toBeInTheDocument();
  });
});

describe('Legacy Trust & Safety Components Compatibility Suite', () => {
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

describe('Next.js App Router Pages Suite', () => {
  it('renders AdminTrustSafetyDashboardPage page', async () => {
    render(<AdminTrustSafetyDashboardPage />);
    expect(await screen.findByText(/Executive Trust & Safety Control Center/i)).toBeInTheDocument();
  });

  it('renders AdminQueuePage page', async () => {
    render(<AdminQueuePage />);
    expect(await screen.findByText(/Back to Trust Dashboard/i)).toBeInTheDocument();
  });

  it('renders AdminAppealsPage page', async () => {
    render(<AdminAppealsPage />);
    expect(await screen.findByText(/User Appeals Review Desk/i)).toBeInTheDocument();
  });

  it('renders AdminPoliciesPage page', async () => {
    render(<AdminPoliciesPage />);
    expect(await screen.findByText(/Platform Safety Policy Studio/i)).toBeInTheDocument();
  });

  it('renders SafetyHubPage page', async () => {
    render(<SafetyHubPage />);
    expect(await screen.findByText(/Proactive Fraud Prevention & Platform Integrity/i)).toBeInTheDocument();
  });

  it('renders UserSettingsAppealsPage page', async () => {
    render(<UserSettingsAppealsPage />);
    expect(await screen.findByText(/User Decision Appeals Manager/i)).toBeInTheDocument();
  });
});
