import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    slug: 'terms',
  }),
}));

import LegalDocumentViewer from '../components/legal/LegalDocumentViewer';
import ConsentBanner from '../components/legal/ConsentBanner';
import PrivacyCenter from '../components/privacy/PrivacyCenter';
import ConsentHistoryView from '../components/privacy/ConsentHistoryView';
import DataExportView from '../components/privacy/DataExportView';
import AccountDeletionModal from '../components/privacy/AccountDeletionModal';
import CookieConsentBanner from '../components/privacy/CookieConsentBanner';
import AdminPrivacyDashboard from '../components/privacy/AdminPrivacyDashboard';

// Import New Privacy & Governance Components
import DataInventoryTable from '../components/privacy/DataInventoryTable';
import DataRequestManager from '../components/privacy/DataRequestManager';
import RetentionManager from '../components/privacy/RetentionManager';
import LegalHoldDialog from '../components/privacy/LegalHoldDialog';
import AccessReviewDesk from '../components/privacy/AccessReviewDesk';
import DataQualityDashboard from '../components/privacy/DataQualityDashboard';
import PrivacyRiskDashboard from '../components/privacy/PrivacyRiskDashboard';
import ThirdPartyProcessorsCard from '../components/privacy/ThirdPartyProcessorsCard';
import PrivacyIncidentManager from '../components/privacy/PrivacyIncidentManager';
import PolicyVersionTable from '../components/privacy/PolicyVersionTable';
import UserPrivacySettings from '../components/privacy/UserPrivacySettings';

// Import New Pages
import SettingsPrivacyPage from '../app/settings/privacy/page';
import AdminPrivacyPage from '../app/admin/privacy/page';
import AdminCompliancePage from '../app/admin/compliance/page';
import AdminDataQualityPage from '../app/admin/data-governance/quality/page';
import AdminPrivacyRiskPage from '../app/admin/data-governance/privacy-risk/page';

// Import API
import { privacyApi } from '../features/privacy/services/privacyApi';

describe('Legal, Privacy & Compliance Module Test Suite', () => {
  it('renders LegalDocumentViewer', () => {
    render(<LegalDocumentViewer title="Terms of Service" slug="terms" />);
    expect(screen.getAllByText(/Terms/i).length).toBeGreaterThan(0);
  });

  it('renders ConsentBanner cookie notification', () => {
    render(<ConsentBanner onCustomize={() => {}} />);
    expect(screen.getByText(/Cookie & Privacy Preferences/i)).toBeInTheDocument();
  });

  it('renders CookieConsentBanner banner', () => {
    render(<CookieConsentBanner onOpenPreferences={() => {}} />);
    expect(screen.getByText(/We Value Your Privacy & Choice/i)).toBeInTheDocument();
  });

  it('renders PrivacyCenter settings dashboard', async () => {
    render(<PrivacyCenter />);
    expect(screen.getByText(/Centralized Privacy & Data Protection Center/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Quick Privacy Controls Summary/i)).toBeInTheDocument();
    });
  });

  it('renders ConsentHistoryView table', async () => {
    render(<ConsentHistoryView />);
    expect(screen.getByText(/Consent History & Regulatory Audit Log/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
    });
  });

  it('renders DataExportView workflow', () => {
    render(<DataExportView />);
    expect(screen.getByText(/Download My Personal Data/i)).toBeInTheDocument();
  });

  it('renders AccountDeletionModal warning dialog', () => {
    render(<AccountDeletionModal open={true} onClose={() => {}} />);
    expect(screen.getAllByText(/Confirm Account Deletion/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Confirm Account Password/i).length).toBeGreaterThan(0);
  });

  it('renders AdminPrivacyDashboard executive console', () => {
    render(<AdminPrivacyDashboard />);
    expect(screen.getByText(/Executive Privacy & Data Protection Console/i)).toBeInTheDocument();
  });

  // --- API Client Tests ---
  describe('Privacy API Client Methods', () => {
    it('fetches data inventory', async () => {
      const inventory = await privacyApi.getDataInventory();
      expect(inventory.length).toBeGreaterThan(0);
      expect(inventory[0]).toHaveProperty('datasetName');
      expect(inventory[0]).toHaveProperty('classification');
    });

    it('fetches data subject requests', async () => {
      const requests = await privacyApi.getDataSubjectRequests();
      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0]).toHaveProperty('requestType');
    });

    it('fetches retention policies', async () => {
      const policies = await privacyApi.getRetentionPolicies();
      expect(policies.length).toBeGreaterThan(0);
      expect(policies[0]).toHaveProperty('retentionDays');
    });

    it('runs retention dry run', async () => {
      const res = await privacyApi.runRetentionDryRun('ret-01');
      expect(res).toHaveProperty('affectedRecordsCount');
      expect(res.affectedRecordsCount).toBeGreaterThan(0);
    });

    it('fetches legal holds', async () => {
      const holds = await privacyApi.getLegalHolds();
      expect(holds.length).toBeGreaterThan(0);
      expect(holds[0]).toHaveProperty('caseNumber');
    });

    it('fetches access reviews', async () => {
      const reviews = await privacyApi.getAccessReviews();
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews[0]).toHaveProperty('resourceAccessed');
    });

    it('fetches third-party processors', async () => {
      const processors = await privacyApi.getThirdPartyProcessors();
      expect(processors.length).toBeGreaterThan(0);
      expect(processors[0]).toHaveProperty('vendorName');
    });

    it('fetches data quality checks and score', async () => {
      const checks = await privacyApi.getDataQualityChecks();
      const score = await privacyApi.getOverallQualityScore();
      expect(checks.length).toBeGreaterThan(0);
      expect(score).toHaveProperty('overallScore');
    });

    it('fetches privacy risk summary and compliance overview', async () => {
      const risk = await privacyApi.getPrivacyRiskSummary();
      const overview = await privacyApi.getComplianceOverview();
      expect(risk).toHaveProperty('riskScore');
      expect(overview).toHaveProperty('gdprCompliance');
    });

    it('fetches privacy incidents and policy versions', async () => {
      const incidents = await privacyApi.getPrivacyIncidents();
      const versions = await privacyApi.getPolicyVersions();
      expect(incidents.length).toBeGreaterThan(0);
      expect(versions.length).toBeGreaterThan(0);
    });
  });

  // --- Component Tests ---
  describe('New Glassmorphic Governance Components', () => {
    it('renders DataInventoryTable component', async () => {
      render(<DataInventoryTable />);
      expect(screen.getByText(/Data Asset & Processing Inventory/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/User Profile & Identity Store/i)).toBeInTheDocument();
      });
    });

    it('renders DataRequestManager component', async () => {
      render(<DataRequestManager />);
      expect(screen.getByText(/Data Subject Rights \(DSAR \/ DSR\) Desk/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/alice.johnson@example.com/i)).toBeInTheDocument();
      });
    });

    it('renders RetentionManager component', async () => {
      render(<RetentionManager />);
      expect(screen.getByText(/Automated Data Retention & Lifecycle Rules/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/User Activity & Audit Logs/i)).toBeInTheDocument();
      });
    });

    it('renders LegalHoldDialog component', async () => {
      render(<LegalHoldDialog />);
      expect(screen.getByText(/Legal Data Preservation Holds/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/LIT-2026-0089/i)).toBeInTheDocument();
      });
    });

    it('renders AccessReviewDesk component', async () => {
      render(<AccessReviewDesk />);
      expect(screen.getByText(/Privileged Data Access Review Desk/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/prod_users_db.sensitive_pii/i)).toBeInTheDocument();
      });
    });

    it('renders DataQualityDashboard component', async () => {
      render(<DataQualityDashboard />);
      expect(screen.getByText(/Overall Data Quality Score/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Email Format & Uniqueness Validation/i)).toBeInTheDocument();
      });
    });

    it('renders PrivacyRiskDashboard component', async () => {
      render(<PrivacyRiskDashboard />);
      expect(screen.getByText(/Enterprise Privacy & Exposure Risk Score/i)).toBeInTheDocument();
      expect(screen.getByText(/GDPR \(EU General Data Protection Regulation\)/i)).toBeInTheDocument();
    });

    it('renders ThirdPartyProcessorsCard component', async () => {
      render(<ThirdPartyProcessorsCard />);
      expect(screen.getByText(/Third-Party Sub-Processor & Transfer Controls Inventory/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/AWS US-East/i)).toBeInTheDocument();
      });
    });

    it('renders PrivacyIncidentManager component', async () => {
      render(<PrivacyIncidentManager />);
      expect(screen.getByText(/Privacy Incident & Data Breach Response Desk/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/INC-2026-0802/i)).toBeInTheDocument();
      });
    });

    it('renders PolicyVersionTable component', async () => {
      render(<PolicyVersionTable />);
      expect(screen.getByText(/Internal Privacy Policies & Version Register/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getAllByText(/Global Master Privacy Policy/i).length).toBeGreaterThan(0);
      });
    });

    it('renders UserPrivacySettings component', async () => {
      render(<UserPrivacySettings />);
      expect(screen.getByText(/User Privacy & Data Subject Rights Hub/i)).toBeInTheDocument();
      expect(screen.getByText(/Usage & Telemetry Analytics/i)).toBeInTheDocument();
    });
  });

  // --- Next.js Pages Tests ---
  describe('Next.js Privacy & Governance Pages', () => {
    it('renders SettingsPrivacyPage', () => {
      render(<SettingsPrivacyPage />);
      expect(screen.getByText(/User Privacy & Data Subject Rights Hub/i)).toBeInTheDocument();
    });

    it('renders AdminPrivacyPage', () => {
      render(<AdminPrivacyPage />);
      expect(screen.getByText(/Executive Data Governance & Privacy Desk/i)).toBeInTheDocument();
    });

    it('renders AdminCompliancePage', () => {
      render(<AdminCompliancePage />);
      expect(screen.getByText(/Compliance & Regulatory Control Center/i)).toBeInTheDocument();
    });

    it('renders AdminDataQualityPage', () => {
      render(<AdminDataQualityPage />);
      expect(screen.getByText(/Enterprise Data Quality & Anomaly Monitor/i)).toBeInTheDocument();
    });

    it('renders AdminPrivacyRiskPage', () => {
      render(<AdminPrivacyRiskPage />);
      expect(screen.getByText(/Privacy Risk Scorecard & Framework Matrix/i)).toBeInTheDocument();
    });
  });
});
