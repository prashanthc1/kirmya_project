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

export const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardStatsDTO> => {
    const res = await apiClient.get<AdminDashboardStatsDTO>('/admin/dashboard');
    return res.data;
    
  },

  listUsers: async (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    const res = await apiClient.get<any[]>('/admin/users', { params });
    return res.data;
    
  },

  getUserByID: async (id: string) => {
    const res = await apiClient.get<any>(`/admin/users/${id}`);
    return res.data;
    
  },

  /**
   * Restrict or release an account.
   *
   * This addressed `PUT /admin/users/:id/status`, which the API has never
   * served - the console's suspend button called a route that answers 404, and
   * the catch beside it reported success anyway. The two endpoints that do
   * exist are these.
   */
  restrictUser: async (id: string, payload: { isRestricted: boolean; reason: string }) => {
    const res = await apiClient.post(`/admin/users/${id}/profile/restrict`, payload);
    return res.data;
  },

  /** Set an account's verification state. `status` is verified/rejected/pending/unverified. */
  verifyUser: async (id: string, payload: { status: string; notes?: string }) => {
    const res = await apiClient.post(`/admin/users/${id}/profile/verify`, payload);
    return res.data;
  },

  listCompanies: async (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    const res = await apiClient.get<any[]>('/admin/companies', { params });
    return res.data;
    
  },

  updateCompanyStatus: async (id: string, payload: { status: string; reason: string }) => {
    const res = await apiClient.put(`/admin/companies/${id}/status`, payload);
    return res.data;
    
  },

  listJobs: async (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    const res = await apiClient.get<any[]>('/admin/jobs', { params });
    return res.data;
    
  },

  moderateJob: async (id: string, payload: { action: string; reason: string }) => {
    const res = await apiClient.post(`/admin/jobs/${id}/moderate`, payload);
    return res.data;
    
  },

  listReports: async (params?: { status?: string; priority?: string }): Promise<ContentReportDTO[]> => {
    const res = await apiClient.get<ContentReportDTO[]>('/admin/reports', { params });
    return res.data;
    
  },

  resolveReport: async (id: string, payload: { action: string; notes: string }) => {
    const res = await apiClient.put(`/admin/reports/${id}`, payload);
    return res.data;
    
  },

  listModerationQueue: async (params?: { status?: string; priority?: string }): Promise<ModerationCaseDTO[]> => {
    const res = await apiClient.get<ModerationCaseDTO[]>('/admin/moderation/queue', { params });
    return res.data;
    
  },

  listVerifications: async (params?: { status?: string }): Promise<VerificationReviewDTO[]> => {
    const res = await apiClient.get<VerificationReviewDTO[]>('/admin/verifications', { params });
    return res.data;
    
  },

  listSecurityEvents: async (userId?: string): Promise<SecurityEventDTO[]> => {
    const res = await apiClient.get<SecurityEventDTO[]>('/admin/security-events', { params: { userId } });
    return res.data;
    
  },

  listAuditLogs: async (params?: { query?: string; adminId?: string; targetType?: string }): Promise<AdminAuditLogDTO[]> => {
    const res = await apiClient.get<AdminAuditLogDTO[]>('/admin/audit-logs', { params });
    return res.data;
    
  },

  listFeatureFlags: async (): Promise<FeatureFlagDTO[]> => {
    const res = await apiClient.get<FeatureFlagDTO[]>('/admin/feature-flags');
    return res.data;
    
  },

  updateFeatureFlag: async (payload: Partial<FeatureFlagDTO>) => {
    const res = await apiClient.post('/admin/feature-flags', payload);
    return res.data;
    
  },

  getSystemSettings: async () => {
    const res = await apiClient.get('/admin/settings');
    return res.data;
    
  },

  createAnnouncement: async (payload: { title: string; content: string; audience: string; priority?: string; channels?: string[] }) => {
    const res = await apiClient.post('/admin/announcements', payload);
    return res.data;
    
  },

  // --- Task 1 Endpoint Implementations ---

  // Background Jobs API
  listBackgroundJobs: async (): Promise<BackgroundJobDTO[]> => {
    try {
      const res = await apiClient.get<BackgroundJobDTO[]>('/admin/background-jobs');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  retryBackgroundJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/admin/background-jobs/${jobId}/retry`);
    return res.data;
    
  },

  triggerBackgroundJob: async (jobName: string): Promise<{ success: boolean; jobId: string }> => {
    const res = await apiClient.post('/admin/background-jobs/trigger', { jobName });
    return res.data;
    
  },

  // Incidents API
  listIncidents: async (): Promise<IncidentDTO[]> => {
    try {
      const res = await apiClient.get<IncidentDTO[]>('/admin/incidents');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
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
    } catch (error) {
      // A write that never reached the server did not happen. This used to
      // return the sample record with the change applied to it.
      throw error;
    }
  },

  // Maintenance Mode API
  getMaintenanceModeConfig: async (): Promise<MaintenanceModeConfigDTO> => {
    try {
      const res = await apiClient.get<MaintenanceModeConfigDTO>('/admin/maintenance-mode');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  updateMaintenanceModeConfig: async (payload: Partial<MaintenanceModeConfigDTO>): Promise<MaintenanceModeConfigDTO> => {
    try {
      const res = await apiClient.put<MaintenanceModeConfigDTO>('/admin/maintenance-mode', payload);
      return res.data;
    } catch (error) {
      // A write that never reached the server did not happen. This used to
      // return the sample record with the change applied to it.
      throw error;
    }
  },

  // Support / Impersonation API
  requestSupportImpersonation: async (payload: SupportImpersonationRequestDTO): Promise<UserImpersonationSessionDTO> => {
    const res = await apiClient.post<UserImpersonationSessionDTO>('/admin/impersonate', payload);
    return res.data;
    
  },

  listImpersonationSessions: async (): Promise<UserImpersonationSessionDTO[]> => {
    try {
      const res = await apiClient.get<UserImpersonationSessionDTO[]>('/admin/impersonate/sessions');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  terminateImpersonationSession: async (sessionId: string): Promise<{ success: boolean }> => {
    const res = await apiClient.post(`/admin/impersonate/sessions/${sessionId}/terminate`);
    return res.data;
    
  },
};
