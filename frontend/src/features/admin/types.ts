export type AdminRoleCode =
  | 'super_admin'
  | 'platform_admin'
  | 'user_admin'
  | 'recruiter_admin'
  | 'company_admin'
  | 'job_admin'
  | 'community_moderator'
  | 'trust_safety_admin'
  | 'verification_admin'
  | 'content_moderator'
  | 'support_admin'
  | 'analytics_admin'
  | 'read_only_admin';

export interface AdminRoleDTO {
  id: string;
  code: AdminRoleCode;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

export interface AdminPermissionDTO {
  id: string;
  code: string;
  category: string;
  description: string;
}

export interface AdminAuditLogDTO {
  id: string;
  adminId: string;
  adminEmail?: string;
  roleCode?: string;
  action: string;
  targetType: string;
  targetId: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: string;
}

export interface ModerationCaseDTO {
  id: string;
  caseNumber: string;
  targetType: string;
  targetId: string;
  targetTitle?: string;
  reporterId?: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  status: 'New' | 'Under Review' | 'Needs Info' | 'Action Required' | 'Resolved' | 'Dismissed' | 'Escalated';
  assignedAdminId?: string;
  aiSummary?: string;
  aiRecommendation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentReportDTO {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  targetTitle?: string;
  category: string;
  reason: string;
  description?: string;
  evidenceUrls?: string[];
  status: 'New' | 'Under Review' | 'Needs Info' | 'Action Required' | 'Resolved' | 'Dismissed' | 'Escalated';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedAdminId?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskScoreDTO {
  id: string;
  entityType: string;
  entityId: string;
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  factors?: Record<string, any>;
  updatedAt: string;
}

export interface VerificationReviewDTO {
  id: string;
  entityType: string;
  entityId: string;
  verificationType: string;
  submittedData?: Record<string, any>;
  documentUrls?: string[];
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Info';
  reviewerId?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityEventDTO {
  id: string;
  userId: string;
  eventType: string;
  status: string;
  ipAddress?: string;
  location?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface FeatureFlagDTO {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  environment: string;
  rolloutPercentage: number;
  startDate?: string;
  endDate?: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface AdminDashboardStatsDTO {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  companies: number;
  verifiedCompanies: number;
  recruiters: number;
  activeJobs: number;
  applications: number;
  reports: number;
  pendingModeration: number;
  pendingVerifications: number;
  securityAlerts: number;
  systemHealth: {
    apiStatus: string;
    databaseStatus: string;
    redisStatus: string;
    queueStatus: string;
    notificationStatus: string;
    aiServiceStatus: string;
    searchServiceStatus: string;
    storageStatus: string;
    workersStatus: string;
  };
  growthTrends: Record<string, number>;
}
