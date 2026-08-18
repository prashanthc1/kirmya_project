export interface DataInventoryItem {
  id: string;
  datasetName: string;
  category: string;
  classification: 'Public' | 'Internal' | 'Confidential' | 'Restricted' | 'PII' | 'PHI';
  owner: string;
  storageLocation: string;
  recordCount: number;
  hasPII: boolean;
  status: 'active' | 'archived' | 'deprecated';
  lastAuditDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSubjectRequestItem {
  id: string;
  userId: string;
  userEmail: string;
  requestType: 'access' | 'erasure' | 'export' | 'rectification' | 'restriction' | 'portability';
  status: 'pending' | 'in_review' | 'processing' | 'completed' | 'rejected';
  submittedAt: string;
  dueDate: string;
  notes?: string;
  fulfilledAt?: string;
}

export interface RetentionPolicyItem {
  id: string;
  category: string;
  retentionDays: number;
  action: 'purge' | 'archive' | 'anonymize';
  isEnabled: boolean;
  description: string;
  lastPurgeDate?: string;
}

export interface LegalHoldItem {
  id: string;
  caseNumber: string;
  title: string;
  reason: string;
  affectedCategories: string[];
  status: 'active' | 'released';
  issuedBy: string;
  createdAt: string;
  releasedAt?: string;
}

export interface DataAccessReviewItem {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  targetUserName: string;
  resourceAccessed: string;
  accessReason: string;
  status: 'pending' | 'approved' | 'revoked' | 'flagged';
  reviewedAt?: string;
  createdAt: string;
}

export interface ThirdPartyProcessorItem {
  id: string;
  vendorName: string;
  serviceType: string;
  dataShared: string[];
  country: string;
  transferMechanism: 'SCC' | 'DPA' | 'BCR' | 'Adequacy' | 'Consent';
  dpaStatus: 'signed' | 'pending' | 'expired';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DataQualityCheckItem {
  id: string;
  datasetId: string;
  datasetName: string;
  checkName: string;
  metricType: 'completeness' | 'accuracy' | 'consistency' | 'uniqueness' | 'validity';
  passRate: number;
  anomaliesCount: number;
  status: 'passed' | 'warning' | 'failed';
  checkedAt: string;
}

export interface PrivacyRiskSummary {
  riskScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  unmitigatedCount: number;
  complianceScore: number;
}

export interface ComplianceOverview {
  gdprCompliance: number;
  ccpaCompliance: number;
  hipaaCompliance: number;
  soc2Compliance: number;
  openDsrCount: number;
  activeLegalHoldCount: number;
  activeIncidentsCount: number;
}

export interface PrivacyIncidentItem {
  id: string;
  incidentNumber: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'contained' | 'notified' | 'resolved';
  affectedCount: number;
  reportedAt: string;
  resolvedAt?: string;
  summary: string;
}

export interface PolicyVersionItem {
  id: string;
  policyName: string;
  version: string;
  status: 'draft' | 'published' | 'deprecated';
  effectiveDate: string;
  author: string;
  changelog: string;
}

export interface DryRunResult {
  affectedRecordsCount: number;
  affectedDatasets: string[];
  estimatedDurationSec: number;
  simulatedAt: string;
}
