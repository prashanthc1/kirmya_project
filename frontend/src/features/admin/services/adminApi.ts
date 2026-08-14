import { authApiClient } from '../../../services/authService';
import {
  AdminDashboardStatsDTO,
  AdminAuditLogDTO,
  ModerationCaseDTO,
  ContentReportDTO,
  VerificationReviewDTO,
  SecurityEventDTO,
  FeatureFlagDTO,
} from '../types';

const apiClient = authApiClient;

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

  updateUserStatus: async (id: string, payload: { status: string; reason: string }) => {
    const res = await apiClient.put(`/admin/users/${id}/status`, payload);
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

  listReports: async (params?: { status?: string; priority?: string }) => {
    const res = await apiClient.get<ContentReportDTO[]>('/admin/reports', { params });
    return res.data;
  },

  resolveReport: async (id: string, payload: { action: string; notes: string }) => {
    const res = await apiClient.put(`/admin/reports/${id}`, payload);
    return res.data;
  },

  listModerationQueue: async (params?: { status?: string; priority?: string }) => {
    const res = await apiClient.get<ModerationCaseDTO[]>('/admin/moderation/queue', { params });
    return res.data;
  },

  listVerifications: async (params?: { status?: string }) => {
    const res = await apiClient.get<VerificationReviewDTO[]>('/admin/verifications', { params });
    return res.data;
  },

  listSecurityEvents: async (userId?: string) => {
    const res = await apiClient.get<SecurityEventDTO[]>('/admin/security-events', { params: { userId } });
    return res.data;
  },

  listAuditLogs: async (params?: { query?: string; adminId?: string; targetType?: string }) => {
    const res = await apiClient.get<AdminAuditLogDTO[]>('/admin/audit-logs', { params });
    return res.data;
  },

  listFeatureFlags: async () => {
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
};
