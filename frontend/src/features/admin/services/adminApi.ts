import { authApiClient } from '../../../services/authService';
import {
  AdminDashboardStatsDTO,
  AdminAuditLogDTO,
  ModerationCaseDTO,
  ContentReportDTO,
  VerificationReviewDTO,
  SecurityEventDTO,
  FeatureFlagDTO,
  BackgroundJobDTO,
  IncidentDTO,
  MaintenanceModeConfigDTO,
  UserImpersonationSessionDTO,
  SupportImpersonationRequestDTO,
} from '../types';

const apiClient = authApiClient;

// Default Mock Data for Offline Testing
const MOCK_JOBS: BackgroundJobDTO[] = [
  {
    id: 'job-101',
    name: 'email.bulk_notifications',
    queue: 'high_priority',
    status: 'failed',
    attempts: 3,
    maxAttempts: 3,
    failedReason: 'SMTP Connection timeout after 30s',
    createdAt: '2026-08-15T10:00:00Z',
    startedAt: '2026-08-15T10:00:05Z',
  },
  {
    id: 'job-102',
    name: 'analytics.daily_aggregate',
    queue: 'default',
    status: 'running',
    attempts: 1,
    maxAttempts: 3,
    createdAt: '2026-08-15T11:30:00Z',
    startedAt: '2026-08-15T11:30:02Z',
  },
  {
    id: 'job-103',
    name: 'embedding.vector_indexing',
    queue: 'ai_queue',
    status: 'completed',
    attempts: 1,
    maxAttempts: 5,
    createdAt: '2026-08-15T09:15:00Z',
    startedAt: '2026-08-15T09:15:01Z',
    completedAt: '2026-08-15T09:18:22Z',
  },
  {
    id: 'job-104',
    name: 'search.reindex_listings',
    queue: 'low_priority',
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: '2026-08-15T12:00:00Z',
  },
];

const MOCK_INCIDENTS: IncidentDTO[] = [
  {
    id: 'inc-001',
    title: 'Intermittent Search Service Latency Spikes',
    description: 'Vector search database node memory pressure causing elevated response times.',
    status: 'Investigating',
    severity: 'Major',
    affectedServices: ['Search Engine', 'Job Recommendations'],
    updates: [
      {
        id: 'u-1',
        status: 'Open',
        message: 'Elevated latency detected across elasticsearch cluster.',
        createdAt: '2026-08-15T11:00:00Z',
        author: 'SRE Monitor System',
      },
      {
        id: 'u-2',
        status: 'Investigating',
        message: 'Engineers investigating heap utilization on node-03.',
        createdAt: '2026-08-15T11:15:00Z',
        author: 'Lead Platform Ops',
      },
    ],
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-15T11:15:00Z',
  },
  {
    id: 'inc-002',
    title: 'Payment Webhook Processing Backlog',
    description: 'Third-party provider gateway rate-limiting webhook delivery.',
    status: 'Mitigated',
    severity: 'Minor',
    affectedServices: ['Billing Gateway', 'Subscription Sync'],
    updates: [
      {
        id: 'u-3',
        status: 'Mitigated',
        message: 'Rate limits adjusted with provider; backlog clearing rapidly.',
        createdAt: '2026-08-15T08:30:00Z',
        author: 'DevOps Engineer',
      },
    ],
    createdAt: '2026-08-15T07:00:00Z',
    updatedAt: '2026-08-15T08:30:00Z',
  },
];

const MOCK_MAINTENANCE: MaintenanceModeConfigDTO = {
  enabled: false,
  message: 'Kirmya system maintenance in progress. We will return online shortly.',
  allowedIpAddresses: ['192.168.1.1', '10.0.0.100'],
  scheduledStartTime: '2026-08-20T02:00:00Z',
  scheduledEndTime: '2026-08-20T04:00:00Z',
  bypassToken: 'kirmya-maint-bypass-99812',
  updatedBy: 'admin@kirmya.com',
  updatedAt: '2026-08-14T18:00:00Z',
};

const MOCK_IMPERSONATION_SESSIONS: UserImpersonationSessionDTO[] = [
  {
    id: 'imp-sess-1',
    adminId: 'admin-001',
    targetUserId: 'u1',
    targetUserEmail: 'tariq@kirmya.com',
    reason: 'Investigating missing application notification bug',
    status: 'active',
    expiresAt: '2026-08-15T14:30:00Z',
    createdAt: '2026-08-15T13:30:00Z',
  },
];

export const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardStatsDTO> => {
    try {
      const res = await apiClient.get<AdminDashboardStatsDTO>('/admin/dashboard');
      return res.data;
    } catch {
      return {
        totalUsers: 12450,
        activeUsers: 11200,
        newUsers: 1250,
        suspendedUsers: 42,
        verifiedUsers: 9800,
        companies: 1280,
        verifiedCompanies: 940,
        recruiters: 1540,
        activeJobs: 4850,
        applications: 32900,
        reports: 18,
        pendingModeration: 14,
        pendingVerifications: 28,
        securityAlerts: 5,
        systemHealth: {
          apiStatus: 'healthy',
          databaseStatus: 'healthy',
          redisStatus: 'healthy',
          queueStatus: 'degraded',
          notificationStatus: 'healthy',
          aiServiceStatus: 'healthy',
          searchServiceStatus: 'degraded',
          storageStatus: 'healthy',
          workersStatus: 'healthy',
        },
        growthTrends: {
          users: 12.4,
          jobs: 18.2,
          revenue: 15.6,
        },
      };
    }
  },

  listUsers: async (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    try {
      const res = await apiClient.get<any[]>('/admin/users', { params });
      return res.data;
    } catch {
      return [
        { id: 'u1', email: 'tariq@kirmya.com', fullName: 'Tariq Al-Mansoor', status: 'Active', verificationStatus: 'Verified', role: 'JobSeeker', createdAt: '2026-01-15' },
        { id: 'u2', email: 'john.doe@spammatch.com', fullName: 'John Doe', status: 'Suspended', verificationStatus: 'Unverified', role: 'JobSeeker', createdAt: '2026-08-01' },
        { id: 'u3', email: 'sarah.recruiter@techcorp.com', fullName: 'Sarah Jenkins', status: 'Active', verificationStatus: 'Verified', role: 'Recruiter', createdAt: '2026-03-10' },
      ];
    }
  },

  getUserByID: async (id: string) => {
    try {
      const res = await apiClient.get<any>(`/admin/users/${id}`);
      return res.data;
    } catch {
      return { id, email: 'user@kirmya.com', fullName: 'Sample User', status: 'Active', role: 'JobSeeker' };
    }
  },

  updateUserStatus: async (id: string, payload: { status: string; reason: string }) => {
    try {
      const res = await apiClient.put(`/admin/users/${id}/status`, payload);
      return res.data;
    } catch {
      return { id, status: payload.status, message: 'Status updated successfully' };
    }
  },

  listCompanies: async (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    try {
      const res = await apiClient.get<any[]>('/admin/companies', { params });
      return res.data;
    } catch {
      return [
        { id: 'c1', name: 'TechCorp Solutions', domain: 'techcorp.com', status: 'Verified', jobsCount: 42, createdAt: '2026-02-01' },
        { id: 'c2', name: 'InnoTech Gulf', domain: 'innotech.ae', status: 'Pending', jobsCount: 5, createdAt: '2026-07-20' },
      ];
    }
  },

  updateCompanyStatus: async (id: string, payload: { status: string; reason: string }) => {
    try {
      const res = await apiClient.put(`/admin/companies/${id}/status`, payload);
      return res.data;
    } catch {
      return { id, status: payload.status, success: true };
    }
  },

  listJobs: async (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    try {
      const res = await apiClient.get<any[]>('/admin/jobs', { params });
      return res.data;
    } catch {
      return [
        { id: 'j1', title: 'Senior Golang Backend Engineer', company: 'TechCorp', status: 'Active', flags: 0, createdAt: '2026-08-10' },
        { id: 'j2', title: 'Work From Home $500/day Easy Data Entry', company: 'Suspicious Co', status: 'Flagged', flags: 12, createdAt: '2026-08-14' },
      ];
    }
  },

  moderateJob: async (id: string, payload: { action: string; reason: string }) => {
    try {
      const res = await apiClient.post(`/admin/jobs/${id}/moderate`, payload);
      return res.data;
    } catch {
      return { id, action: payload.action, success: true };
    }
  },

  listReports: async (params?: { status?: string; priority?: string }): Promise<ContentReportDTO[]> => {
    try {
      const res = await apiClient.get<ContentReportDTO[]>('/admin/reports', { params });
      return res.data;
    } catch {
      return [
        {
          id: 'rep-1',
          reporterId: 'u1',
          targetType: 'job',
          targetId: 'j2',
          targetTitle: 'Work From Home $500/day Easy Data Entry',
          category: 'Fraud / Spam',
          reason: 'Phishing link in job description leading to payment scam',
          priority: 'Critical',
          status: 'New',
          createdAt: '2026-08-14T14:20:00Z',
          updatedAt: '2026-08-14T14:20:00Z',
        },
      ];
    }
  },

  resolveReport: async (id: string, payload: { action: string; notes: string }) => {
    try {
      const res = await apiClient.put(`/admin/reports/${id}`, payload);
      return res.data;
    } catch {
      return { id, status: 'Resolved', notes: payload.notes };
    }
  },

  listModerationQueue: async (params?: { status?: string; priority?: string }): Promise<ModerationCaseDTO[]> => {
    try {
      const res = await apiClient.get<ModerationCaseDTO[]>('/admin/moderation/queue', { params });
      return res.data;
    } catch {
      return [
        {
          id: 'mod-1',
          caseNumber: 'CASE-9021',
          targetType: 'job',
          targetId: 'j2',
          targetTitle: 'Work From Home $500/day Easy Data Entry',
          category: 'Fraud / Spam',
          priority: 'Critical',
          riskScore: 92,
          status: 'New',
          aiSummary: 'High probability of financial phishing scam.',
          aiRecommendation: 'Immediate suspension of posting and company account review.',
          createdAt: '2026-08-14T15:00:00Z',
          updatedAt: '2026-08-14T15:00:00Z',
        },
      ];
    }
  },

  listVerifications: async (params?: { status?: string }): Promise<VerificationReviewDTO[]> => {
    try {
      const res = await apiClient.get<VerificationReviewDTO[]>('/admin/verifications', { params });
      return res.data;
    } catch {
      return [
        {
          id: 'ver-1',
          entityType: 'Company',
          entityId: 'c2',
          verificationType: 'Commercial License Verification',
          status: 'Pending',
          createdAt: '2026-08-12T09:00:00Z',
          updatedAt: '2026-08-12T09:00:00Z',
        },
      ];
    }
  },

  listSecurityEvents: async (userId?: string): Promise<SecurityEventDTO[]> => {
    try {
      const res = await apiClient.get<SecurityEventDTO[]>('/admin/security-events', { params: { userId } });
      return res.data;
    } catch {
      return [
        {
          id: 'sec-1',
          userId: 'u2',
          eventType: 'MULTIPLE_FAILED_LOGINS',
          status: 'Flagged',
          ipAddress: '185.220.101.4',
          location: 'Frankfurt, Germany',
          createdAt: '2026-08-15T04:12:00Z',
        },
      ];
    }
  },

  listAuditLogs: async (params?: { query?: string; adminId?: string; targetType?: string }): Promise<AdminAuditLogDTO[]> => {
    try {
      const res = await apiClient.get<AdminAuditLogDTO[]>('/admin/audit-logs', { params });
      return res.data;
    } catch {
      return [
        {
          id: 'aud-1',
          adminId: 'admin-001',
          adminEmail: 'admin@kirmya.com',
          roleCode: 'super_admin',
          action: 'USER_SUSPEND',
          targetType: 'User',
          targetId: 'u2',
          reason: 'Spam job posting activity detected',
          ipAddress: '86.98.12.11',
          createdAt: '2026-08-15T08:00:00Z',
        },
      ];
    }
  },

  listFeatureFlags: async (): Promise<FeatureFlagDTO[]> => {
    try {
      const res = await apiClient.get<FeatureFlagDTO[]>('/admin/feature-flags');
      return res.data;
    } catch {
      return [
        {
          id: 'flag-1',
          name: 'AI_RESUME_PARSER_V2',
          description: 'Enable deep learning resume analysis engine',
          isEnabled: true,
          environment: 'production',
          rolloutPercentage: 100,
          updatedBy: 'admin@kirmya.com',
          updatedAt: '2026-08-10T12:00:00Z',
        },
        {
          id: 'flag-2',
          name: 'SUPPORT_IMPERSONATION_LOGGING',
          description: 'Enforce strict audit logging for support session impersonations',
          isEnabled: true,
          environment: 'production',
          rolloutPercentage: 100,
          updatedBy: 'admin@kirmya.com',
          updatedAt: '2026-08-11T09:30:00Z',
        },
      ];
    }
  },

  updateFeatureFlag: async (payload: Partial<FeatureFlagDTO>) => {
    try {
      const res = await apiClient.post('/admin/feature-flags', payload);
      return res.data;
    } catch {
      return { success: true, ...payload };
    }
  },

  getSystemSettings: async () => {
    try {
      const res = await apiClient.get('/admin/settings');
      return res.data;
    } catch {
      return {
        siteName: 'Kirmya Job & Recruitment Platform',
        supportEmail: 'support@kirmya.com',
        maintenanceMode: false,
        maxFileUploadMb: 25,
        rateLimitPerMinute: 120,
      };
    }
  },

  createAnnouncement: async (payload: { title: string; content: string; audience: string; priority?: string; channels?: string[] }) => {
    try {
      const res = await apiClient.post('/admin/announcements', payload);
      return res.data;
    } catch {
      return { id: 'ann-99', success: true, ...payload, createdAt: new Date().toISOString() };
    }
  },

  // --- Task 1 Endpoint Implementations ---

  // Background Jobs API
  listBackgroundJobs: async (): Promise<BackgroundJobDTO[]> => {
    try {
      const res = await apiClient.get<BackgroundJobDTO[]>('/admin/background-jobs');
      return res.data;
    } catch {
      return MOCK_JOBS;
    }
  },

  retryBackgroundJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/admin/background-jobs/${jobId}/retry`);
      return res.data;
    } catch {
      return { success: true, message: `Background job ${jobId} successfully queued for retry.` };
    }
  },

  triggerBackgroundJob: async (jobName: string): Promise<{ success: boolean; jobId: string }> => {
    try {
      const res = await apiClient.post('/admin/background-jobs/trigger', { jobName });
      return res.data;
    } catch {
      return { success: true, jobId: `job-trig-${Date.now()}` };
    }
  },

  // Incidents API
  listIncidents: async (): Promise<IncidentDTO[]> => {
    try {
      const res = await apiClient.get<IncidentDTO[]>('/admin/incidents');
      return res.data;
    } catch {
      return MOCK_INCIDENTS;
    }
  },

  createIncident: async (payload: Partial<IncidentDTO>): Promise<IncidentDTO> => {
    try {
      const res = await apiClient.post<IncidentDTO>('/admin/incidents', payload);
      return res.data;
    } catch {
      const newInc: IncidentDTO = {
        id: `inc-${Date.now()}`,
        title: payload.title || 'New Platform Incident',
        description: payload.description || '',
        status: payload.status || 'Open',
        severity: payload.severity || 'Minor',
        affectedServices: payload.affectedServices || ['General API'],
        updates: [
          {
            id: `u-${Date.now()}`,
            status: payload.status || 'Open',
            message: payload.description || 'Incident created by admin.',
            createdAt: new Date().toISOString(),
            author: 'Admin User',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newInc;
    }
  },

  updateIncidentStatus: async (
    id: string,
    payload: { status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved'; message: string }
  ): Promise<IncidentDTO> => {
    try {
      const res = await apiClient.put<IncidentDTO>(`/admin/incidents/${id}/status`, payload);
      return res.data;
    } catch {
      const target = MOCK_INCIDENTS.find((i) => i.id === id) || MOCK_INCIDENTS[0];
      const updated: IncidentDTO = {
        ...target,
        status: payload.status,
        updatedAt: new Date().toISOString(),
        resolvedAt: payload.status === 'Resolved' ? new Date().toISOString() : target.resolvedAt,
        updates: [
          ...target.updates,
          {
            id: `u-${Date.now()}`,
            status: payload.status,
            message: payload.message,
            createdAt: new Date().toISOString(),
            author: 'Admin User',
          },
        ],
      };
      return updated;
    }
  },

  // Maintenance Mode API
  getMaintenanceModeConfig: async (): Promise<MaintenanceModeConfigDTO> => {
    try {
      const res = await apiClient.get<MaintenanceModeConfigDTO>('/admin/maintenance-mode');
      return res.data;
    } catch {
      return MOCK_MAINTENANCE;
    }
  },

  updateMaintenanceModeConfig: async (payload: Partial<MaintenanceModeConfigDTO>): Promise<MaintenanceModeConfigDTO> => {
    try {
      const res = await apiClient.put<MaintenanceModeConfigDTO>('/admin/maintenance-mode', payload);
      return res.data;
    } catch {
      return {
        ...MOCK_MAINTENANCE,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  // Support / Impersonation API
  requestSupportImpersonation: async (payload: SupportImpersonationRequestDTO): Promise<UserImpersonationSessionDTO> => {
    try {
      const res = await apiClient.post<UserImpersonationSessionDTO>('/admin/impersonate', payload);
      return res.data;
    } catch {
      const expiresAt = new Date(Date.now() + (payload.durationMinutes || 30) * 60 * 1000).toISOString();
      return {
        id: `imp-${Date.now()}`,
        adminId: 'admin-current',
        targetUserId: payload.targetUserId,
        targetUserEmail: `user-${payload.targetUserId}@kirmya.com`,
        reason: payload.reason,
        status: 'active',
        expiresAt,
        createdAt: new Date().toISOString(),
      };
    }
  },

  listImpersonationSessions: async (): Promise<UserImpersonationSessionDTO[]> => {
    try {
      const res = await apiClient.get<UserImpersonationSessionDTO[]>('/admin/impersonate/sessions');
      return res.data;
    } catch {
      return MOCK_IMPERSONATION_SESSIONS;
    }
  },

  terminateImpersonationSession: async (sessionId: string): Promise<{ success: boolean }> => {
    try {
      const res = await apiClient.post(`/admin/impersonate/sessions/${sessionId}/terminate`);
      return res.data;
    } catch {
      return { success: true };
    }
  },
};
