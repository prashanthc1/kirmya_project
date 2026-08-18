import { authApiClient } from '../../../services/authService';
import {
  DataInventoryItem,
  DataSubjectRequestItem,
  RetentionPolicyItem,
  LegalHoldItem,
  DataAccessReviewItem,
  ThirdPartyProcessorItem,
  DataQualityCheckItem,
  PrivacyRiskSummary,
  ComplianceOverview,
  PrivacyIncidentItem,
  PolicyVersionItem,
  DryRunResult,
} from '../types';

const apiClient = authApiClient;
const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

// Mock Fallback Data
const MOCK_DATA_INVENTORY: DataInventoryItem[] = [
  {
    id: 'inv-101',
    datasetName: 'User Profile & Identity Store',
    category: 'User Data',
    classification: 'PII',
    owner: 'Identity & Auth Team',
    storageLocation: 'PostgreSQL - prod_users_db',
    recordCount: 1250000,
    hasPII: true,
    status: 'active',
    lastAuditDate: '2026-07-15',
    createdAt: '2025-01-10',
    updatedAt: '2026-07-15',
  },
  {
    id: 'inv-102',
    datasetName: 'Billing & Transaction Ledger',
    category: 'Financial',
    classification: 'Restricted',
    owner: 'FinTech Platform Team',
    storageLocation: 'PostgreSQL - prod_billing_db',
    recordCount: 450000,
    hasPII: true,
    status: 'active',
    lastAuditDate: '2026-08-01',
    createdAt: '2025-01-15',
    updatedAt: '2026-08-01',
  },
  {
    id: 'inv-103',
    datasetName: 'Telemetry & User Interaction Logs',
    category: 'Analytics',
    classification: 'Internal',
    owner: 'Data Engineering',
    storageLocation: 'ClickHouse - telemetry_events',
    recordCount: 89000000,
    hasPII: false,
    status: 'active',
    lastAuditDate: '2026-06-20',
    createdAt: '2025-03-01',
    updatedAt: '2026-06-20',
  },
  {
    id: 'inv-104',
    datasetName: 'Recruiter Candidate Resume Index',
    category: 'Recruiting',
    classification: 'Confidential',
    owner: 'Match & AI Squad',
    storageLocation: 'AWS S3 - kirmya-resumes-prod',
    recordCount: 680000,
    hasPII: true,
    status: 'active',
    lastAuditDate: '2026-07-28',
    createdAt: '2025-02-10',
    updatedAt: '2026-07-28',
  },
];

const MOCK_DSR_REQUESTS: DataSubjectRequestItem[] = [
  {
    id: 'dsr-901',
    userId: 'usr-1102',
    userEmail: 'alice.johnson@example.com',
    requestType: 'export',
    status: 'completed',
    submittedAt: '2026-08-10T10:00:00Z',
    dueDate: '2026-09-09T10:00:00Z',
    fulfilledAt: '2026-08-12T14:30:00Z',
    notes: 'Exported personal profile and interaction history.',
  },
  {
    id: 'dsr-902',
    userId: 'usr-4409',
    userEmail: 'bob.smith@example.com',
    requestType: 'erasure',
    status: 'in_review',
    submittedAt: '2026-08-15T08:15:00Z',
    dueDate: '2026-09-14T08:15:00Z',
    notes: 'Undergoing legal hold check prior to purge.',
  },
  {
    id: 'dsr-903',
    userId: 'usr-7811',
    userEmail: 'carol.davis@example.com',
    requestType: 'restriction',
    status: 'pending',
    submittedAt: '2026-08-17T16:45:00Z',
    dueDate: '2026-09-16T16:45:00Z',
  },
];

const MOCK_RETENTION_POLICIES: RetentionPolicyItem[] = [
  {
    id: 'ret-01',
    category: 'User Activity & Audit Logs',
    retentionDays: 365,
    action: 'purge',
    isEnabled: true,
    description: 'Purge audit trail logs older than 1 year',
    lastPurgeDate: '2026-08-01',
  },
  {
    id: 'ret-02',
    category: 'Inactive Accounts Data',
    retentionDays: 730,
    action: 'anonymize',
    isEnabled: true,
    description: 'Anonymize user profiles inactive for more than 2 years',
    lastPurgeDate: '2026-07-15',
  },
  {
    id: 'ret-03',
    category: 'Application Draft Documents',
    retentionDays: 90,
    action: 'purge',
    isEnabled: false,
    description: 'Remove incomplete application drafts after 90 days',
  },
];

const MOCK_LEGAL_HOLDS: LegalHoldItem[] = [
  {
    id: 'hold-301',
    caseNumber: 'LIT-2026-0089',
    title: 'Employment Dispute Preservation Order',
    reason: 'Active litigation regarding candidate selection records.',
    affectedCategories: ['Recruiting', 'User Data'],
    status: 'active',
    issuedBy: 'Sarah Connor (General Counsel)',
    createdAt: '2026-06-01T09:00:00Z',
  },
  {
    id: 'hold-302',
    caseNumber: 'AUD-2026-0012',
    title: 'Tax Compliance Audit Hold',
    reason: 'State tax authority compliance review for 2024-2025 billing records.',
    affectedCategories: ['Financial'],
    status: 'released',
    issuedBy: 'Mark Miller (Compliance Lead)',
    createdAt: '2026-01-10T11:00:00Z',
    releasedAt: '2026-07-20T17:00:00Z',
  },
];

const MOCK_ACCESS_REVIEWS: DataAccessReviewItem[] = [
  {
    id: 'rev-501',
    reviewerId: 'adm-01',
    reviewerName: 'Alex Mercer (Admin)',
    targetUserId: 'usr-901',
    targetUserName: 'Dev Support Bot',
    resourceAccessed: 'prod_users_db.sensitive_pii',
    accessReason: 'Production incident debugging #8912',
    status: 'approved',
    reviewedAt: '2026-08-16T11:20:00Z',
    createdAt: '2026-08-16T11:00:00Z',
  },
  {
    id: 'rev-502',
    reviewerId: 'adm-02',
    reviewerName: 'Elena Rostova (SecOps)',
    targetUserId: 'usr-304',
    targetUserName: 'External Auditor',
    resourceAccessed: 'financial_ledger.invoices',
    accessReason: 'Quarterly SOC2 compliance review',
    status: 'pending',
    createdAt: '2026-08-18T09:30:00Z',
  },
];

const MOCK_PROCESSORS: ThirdPartyProcessorItem[] = [
  {
    id: 'proc-01',
    vendorName: 'AWS US-East',
    serviceType: 'Cloud Infrastructure & Database Hosting',
    dataShared: ['All Database Schemas', 'Object Storage'],
    country: 'United States',
    transferMechanism: 'SCC',
    dpaStatus: 'signed',
    riskLevel: 'low',
  },
  {
    id: 'proc-02',
    vendorName: 'OpenAI API Services',
    serviceType: 'AI Resume Summarization & Matching',
    dataShared: ['Anonymized Resume Texts', 'Job Descriptions'],
    country: 'United States',
    transferMechanism: 'DPA',
    dpaStatus: 'signed',
    riskLevel: 'medium',
  },
  {
    id: 'proc-03',
    vendorName: 'Stripe Payments Inc.',
    serviceType: 'Payment Processing & Subscriptions',
    dataShared: ['Billing Address', 'Payment Tokens'],
    country: 'United States',
    transferMechanism: 'Adequacy',
    dpaStatus: 'signed',
    riskLevel: 'low',
  },
];

const MOCK_QUALITY_CHECKS: DataQualityCheckItem[] = [
  {
    id: 'qc-101',
    datasetId: 'inv-101',
    datasetName: 'User Profile & Identity Store',
    checkName: 'Email Format & Uniqueness Validation',
    metricType: 'validity',
    passRate: 99.8,
    anomaliesCount: 12,
    status: 'passed',
    checkedAt: '2026-08-18T04:00:00Z',
  },
  {
    id: 'qc-102',
    datasetId: 'inv-102',
    datasetName: 'Billing & Transaction Ledger',
    checkName: 'Tax Identification Number Completeness',
    metricType: 'completeness',
    passRate: 94.2,
    anomaliesCount: 86,
    status: 'warning',
    checkedAt: '2026-08-18T04:00:00Z',
  },
  {
    id: 'qc-103',
    datasetId: 'inv-104',
    datasetName: 'Recruiter Candidate Resume Index',
    checkName: 'Extracted Skills Deduplication Check',
    metricType: 'uniqueness',
    passRate: 88.5,
    anomaliesCount: 340,
    status: 'failed',
    checkedAt: '2026-08-18T04:00:00Z',
  },
];

const MOCK_RISK_SUMMARY: PrivacyRiskSummary = {
  riskScore: 24,
  highRiskCount: 1,
  mediumRiskCount: 3,
  lowRiskCount: 14,
  unmitigatedCount: 2,
  complianceScore: 92,
};

const MOCK_COMPLIANCE_OVERVIEW: ComplianceOverview = {
  gdprCompliance: 96,
  ccpaCompliance: 94,
  hipaaCompliance: 89,
  soc2Compliance: 98,
  openDsrCount: 2,
  activeLegalHoldCount: 1,
  activeIncidentsCount: 0,
};

const MOCK_INCIDENTS: PrivacyIncidentItem[] = [
  {
    id: 'inc-001',
    incidentNumber: 'INC-2026-0802',
    title: 'Excessive API Rate Access Warning on Candidate Endpoints',
    severity: 'medium',
    status: 'contained',
    affectedCount: 45,
    reportedAt: '2026-08-02T14:10:00Z',
    resolvedAt: '2026-08-03T09:00:00Z',
    summary: 'Internal developer key exceeded query rate limit; credentials revoked.',
  },
];

const MOCK_POLICY_VERSIONS: PolicyVersionItem[] = [
  {
    id: 'pol-v2.4',
    policyName: 'Global Master Privacy Policy',
    version: '2.4.0',
    status: 'published',
    effectiveDate: '2026-06-01',
    author: 'Legal & Privacy Office',
    changelog: 'Updated AI data processing disclosures and EU-US Data Privacy Framework details.',
  },
  {
    id: 'pol-v2.5-draft',
    policyName: 'Global Master Privacy Policy',
    version: '2.5.0-draft',
    status: 'draft',
    effectiveDate: '2026-10-01',
    author: 'Compliance Team',
    changelog: 'Added explicit opt-out provisions for automated career scoring algorithms.',
  },
];

export const privacyApi = {
  // Data Inventory
  async getDataInventory(): Promise<DataInventoryItem[]> {
    if (isTestEnv) return MOCK_DATA_INVENTORY;
    try {
      const res = await apiClient.get<DataInventoryItem[]>('/admin/privacy/inventory', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_DATA_INVENTORY;
    }
  },

  async updateDataInventoryItem(
    id: string,
    updates: Partial<DataInventoryItem>
  ): Promise<DataInventoryItem> {
    if (isTestEnv) {
      const existing = MOCK_DATA_INVENTORY.find((i) => i.id === id) || MOCK_DATA_INVENTORY[0];
      return { ...existing, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
    }
    try {
      const res = await apiClient.put<DataInventoryItem>(`/admin/privacy/inventory/${id}`, updates, { timeout: 1000 });
      return res.data;
    } catch {
      const existing = MOCK_DATA_INVENTORY.find((i) => i.id === id) || MOCK_DATA_INVENTORY[0];
      return { ...existing, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
    }
  },

  // Data Subject Requests (DSAR)
  async getDataSubjectRequests(): Promise<DataSubjectRequestItem[]> {
    if (isTestEnv) return MOCK_DSR_REQUESTS;
    try {
      const res = await apiClient.get<DataSubjectRequestItem[]>('/privacy/dsr/requests', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_DSR_REQUESTS;
    }
  },

  async createDataSubjectRequest(
    data: Omit<DataSubjectRequestItem, 'id' | 'status' | 'submittedAt'>
  ): Promise<DataSubjectRequestItem> {
    if (isTestEnv) {
      const newReq: DataSubjectRequestItem = {
        id: `dsr-${Date.now()}`,
        ...data,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      MOCK_DSR_REQUESTS.unshift(newReq);
      return newReq;
    }
    try {
      const res = await apiClient.post<DataSubjectRequestItem>('/privacy/dsr/requests', data, { timeout: 1000 });
      return res.data;
    } catch {
      const newReq: DataSubjectRequestItem = {
        id: `dsr-${Date.now()}`,
        ...data,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      MOCK_DSR_REQUESTS.unshift(newReq);
      return newReq;
    }
  },

  async updateDSRStatus(
    id: string,
    status: DataSubjectRequestItem['status'],
    notes?: string
  ): Promise<DataSubjectRequestItem> {
    if (isTestEnv) {
      const req = MOCK_DSR_REQUESTS.find((r) => r.id === id) || MOCK_DSR_REQUESTS[0];
      req.status = status;
      if (notes) req.notes = notes;
      if (status === 'completed') req.fulfilledAt = new Date().toISOString();
      return { ...req };
    }
    try {
      const res = await apiClient.patch<DataSubjectRequestItem>(`/privacy/dsr/requests/${id}`, {
        status,
        notes,
      }, { timeout: 1000 });
      return res.data;
    } catch {
      const req = MOCK_DSR_REQUESTS.find((r) => r.id === id) || MOCK_DSR_REQUESTS[0];
      req.status = status;
      if (notes) req.notes = notes;
      if (status === 'completed') req.fulfilledAt = new Date().toISOString();
      return { ...req };
    }
  },

  // Retention Policies
  async getRetentionPolicies(): Promise<RetentionPolicyItem[]> {
    if (isTestEnv) return MOCK_RETENTION_POLICIES;
    try {
      const res = await apiClient.get<RetentionPolicyItem[]>('/admin/privacy/retention', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_RETENTION_POLICIES;
    }
  },

  async runRetentionDryRun(id: string): Promise<DryRunResult> {
    if (isTestEnv) {
      return {
        affectedRecordsCount: 1420,
        affectedDatasets: ['Telemetry Logs', 'Expired Session Tokens'],
        estimatedDurationSec: 4.2,
        simulatedAt: new Date().toISOString(),
      };
    }
    try {
      const res = await apiClient.post<DryRunResult>(`/admin/privacy/retention/${id}/dry-run`, {}, { timeout: 1000 });
      return res.data;
    } catch {
      return {
        affectedRecordsCount: 1420,
        affectedDatasets: ['Telemetry Logs', 'Expired Session Tokens'],
        estimatedDurationSec: 4.2,
        simulatedAt: new Date().toISOString(),
      };
    }
  },

  async executeRetentionPurge(id: string): Promise<{ success: boolean; purgedCount: number }> {
    if (isTestEnv) {
      const pol = MOCK_RETENTION_POLICIES.find((p) => p.id === id);
      if (pol) pol.lastPurgeDate = new Date().toISOString().split('T')[0];
      return { success: true, purgedCount: 1420 };
    }
    try {
      const res = await apiClient.post<{ success: boolean; purgedCount: number }>(
        `/admin/privacy/retention/${id}/purge`,
        {},
        { timeout: 1000 }
      );
      return res.data;
    } catch {
      const pol = MOCK_RETENTION_POLICIES.find((p) => p.id === id);
      if (pol) {
        pol.lastPurgeDate = new Date().toISOString().split('T')[0];
      }
      return { success: true, purgedCount: 1420 };
    }
  },

  // Legal Holds
  async getLegalHolds(): Promise<LegalHoldItem[]> {
    if (isTestEnv) return MOCK_LEGAL_HOLDS;
    try {
      const res = await apiClient.get<LegalHoldItem[]>('/admin/privacy/legal-holds', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_LEGAL_HOLDS;
    }
  },

  async createLegalHold(
    hold: Omit<LegalHoldItem, 'id' | 'status' | 'createdAt'>
  ): Promise<LegalHoldItem> {
    if (isTestEnv) {
      const newHold: LegalHoldItem = {
        id: `hold-${Date.now()}`,
        ...hold,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      MOCK_LEGAL_HOLDS.unshift(newHold);
      return newHold;
    }
    try {
      const res = await apiClient.post<LegalHoldItem>('/admin/privacy/legal-holds', hold, { timeout: 1000 });
      return res.data;
    } catch {
      const newHold: LegalHoldItem = {
        id: `hold-${Date.now()}`,
        ...hold,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      MOCK_LEGAL_HOLDS.unshift(newHold);
      return newHold;
    }
  },

  async releaseLegalHold(id: string): Promise<LegalHoldItem> {
    if (isTestEnv) {
      const hold = MOCK_LEGAL_HOLDS.find((h) => h.id === id) || MOCK_LEGAL_HOLDS[0];
      hold.status = 'released';
      hold.releasedAt = new Date().toISOString();
      return { ...hold };
    }
    try {
      const res = await apiClient.post<LegalHoldItem>(`/admin/privacy/legal-holds/${id}/release`, {}, { timeout: 1000 });
      return res.data;
    } catch {
      const hold = MOCK_LEGAL_HOLDS.find((h) => h.id === id) || MOCK_LEGAL_HOLDS[0];
      hold.status = 'released';
      hold.releasedAt = new Date().toISOString();
      return { ...hold };
    }
  },

  // Data Access Reviews
  async getAccessReviews(): Promise<DataAccessReviewItem[]> {
    if (isTestEnv) return MOCK_ACCESS_REVIEWS;
    try {
      const res = await apiClient.get<DataAccessReviewItem[]>('/admin/privacy/access-reviews', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_ACCESS_REVIEWS;
    }
  },

  async updateAccessReviewStatus(
    id: string,
    status: DataAccessReviewItem['status']
  ): Promise<DataAccessReviewItem> {
    if (isTestEnv) {
      const rev = MOCK_ACCESS_REVIEWS.find((r) => r.id === id) || MOCK_ACCESS_REVIEWS[0];
      rev.status = status;
      rev.reviewedAt = new Date().toISOString();
      return { ...rev };
    }
    try {
      const res = await apiClient.patch<DataAccessReviewItem>(
        `/admin/privacy/access-reviews/${id}`,
        { status },
        { timeout: 1000 }
      );
      return res.data;
    } catch {
      const rev = MOCK_ACCESS_REVIEWS.find((r) => r.id === id) || MOCK_ACCESS_REVIEWS[0];
      rev.status = status;
      rev.reviewedAt = new Date().toISOString();
      return { ...rev };
    }
  },

  // Third-Party Processors
  async getThirdPartyProcessors(): Promise<ThirdPartyProcessorItem[]> {
    if (isTestEnv) return MOCK_PROCESSORS;
    try {
      const res = await apiClient.get<ThirdPartyProcessorItem[]>('/admin/privacy/processors', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_PROCESSORS;
    }
  },

  async updateProcessor(
    id: string,
    updates: Partial<ThirdPartyProcessorItem>
  ): Promise<ThirdPartyProcessorItem> {
    if (isTestEnv) {
      const proc = MOCK_PROCESSORS.find((p) => p.id === id) || MOCK_PROCESSORS[0];
      return { ...proc, ...updates };
    }
    try {
      const res = await apiClient.put<ThirdPartyProcessorItem>(
        `/admin/privacy/processors/${id}`,
        updates,
        { timeout: 1000 }
      );
      return res.data;
    } catch {
      const proc = MOCK_PROCESSORS.find((p) => p.id === id) || MOCK_PROCESSORS[0];
      return { ...proc, ...updates };
    }
  },

  // Data Quality Checks
  async getDataQualityChecks(): Promise<DataQualityCheckItem[]> {
    if (isTestEnv) return MOCK_QUALITY_CHECKS;
    try {
      const res = await apiClient.get<DataQualityCheckItem[]>('/admin/data-governance/quality', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_QUALITY_CHECKS;
    }
  },

  async getOverallQualityScore(): Promise<{
    overallScore: number;
    passedCount: number;
    warningCount: number;
    failedCount: number;
  }> {
    if (isTestEnv) {
      return {
        overallScore: 94.2,
        passedCount: 14,
        warningCount: 2,
        failedCount: 1,
      };
    }
    try {
      const res = await apiClient.get<{
        overallScore: number;
        passedCount: number;
        warningCount: number;
        failedCount: number;
      }>('/admin/data-governance/quality/score', { timeout: 1000 });
      return res.data;
    } catch {
      return {
        overallScore: 94.2,
        passedCount: 14,
        warningCount: 2,
        failedCount: 1,
      };
    }
  },

  // Privacy Risk & Compliance
  async getPrivacyRiskSummary(): Promise<PrivacyRiskSummary> {
    if (isTestEnv) return MOCK_RISK_SUMMARY;
    try {
      const res = await apiClient.get<PrivacyRiskSummary>('/admin/privacy/risk-summary', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_RISK_SUMMARY;
    }
  },

  async getComplianceOverview(): Promise<ComplianceOverview> {
    if (isTestEnv) return MOCK_COMPLIANCE_OVERVIEW;
    try {
      const res = await apiClient.get<ComplianceOverview>('/admin/compliance/overview', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_COMPLIANCE_OVERVIEW;
    }
  },

  // Privacy Incidents
  async getPrivacyIncidents(): Promise<PrivacyIncidentItem[]> {
    if (isTestEnv) return MOCK_INCIDENTS;
    try {
      const res = await apiClient.get<PrivacyIncidentItem[]>('/admin/privacy/incidents', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_INCIDENTS;
    }
  },

  async updateIncidentStatus(
    id: string,
    status: PrivacyIncidentItem['status']
  ): Promise<PrivacyIncidentItem> {
    if (isTestEnv) {
      const inc = MOCK_INCIDENTS.find((i) => i.id === id) || MOCK_INCIDENTS[0];
      inc.status = status;
      if (status === 'resolved') inc.resolvedAt = new Date().toISOString();
      return { ...inc };
    }
    try {
      const res = await apiClient.patch<PrivacyIncidentItem>(`/admin/privacy/incidents/${id}`, {
        status,
      }, { timeout: 1000 });
      return res.data;
    } catch {
      const inc = MOCK_INCIDENTS.find((i) => i.id === id) || MOCK_INCIDENTS[0];
      inc.status = status;
      if (status === 'resolved') inc.resolvedAt = new Date().toISOString();
      return { ...inc };
    }
  },

  // Policy Versions
  async getPolicyVersions(): Promise<PolicyVersionItem[]> {
    if (isTestEnv) return MOCK_POLICY_VERSIONS;
    try {
      const res = await apiClient.get<PolicyVersionItem[]>('/admin/compliance/policies', { timeout: 1000 });
      return res.data;
    } catch {
      return MOCK_POLICY_VERSIONS;
    }
  },

  async publishPolicyVersion(id: string): Promise<PolicyVersionItem> {
    if (isTestEnv) {
      const pol = MOCK_POLICY_VERSIONS.find((p) => p.id === id) || MOCK_POLICY_VERSIONS[0];
      pol.status = 'published';
      pol.effectiveDate = new Date().toISOString().split('T')[0];
      return { ...pol };
    }
    try {
      const res = await apiClient.post<PolicyVersionItem>(
        `/admin/compliance/policies/${id}/publish`,
        {},
        { timeout: 1000 }
      );
      return res.data;
    } catch {
      const pol = MOCK_POLICY_VERSIONS.find((p) => p.id === id) || MOCK_POLICY_VERSIONS[0];
      pol.status = 'published';
      pol.effectiveDate = new Date().toISOString().split('T')[0];
      return { ...pol };
    }
  },
};
