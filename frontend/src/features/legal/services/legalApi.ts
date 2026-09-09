import { authApiClient } from '../../../services/authService';
import {
  LegalDocument,
  CookieItem,
  CookiePreferences,
  PrivacyPreferences,
  ConsentHistoryItem,
  PrivacyRequest,
  DataExportJob,
  DataProcessingRecord,
  RetentionPolicy,
  ThirdPartyService,
  PrivacyDashboardSummary,
} from '../types';

const apiClient = authApiClient;

export const legalApi = {
  async getDocument(slug: string): Promise<LegalDocument> {
    const res = await apiClient.get<{ data: LegalDocument }>(`/legal/documents/${slug}`);
    return res.data.data;
    
  },

  async getCookies(): Promise<CookieItem[]> {
    const res = await apiClient.get<{ data: CookieItem[] }>('/cookies');
    return res.data.data || [];
    
  },

  async saveCookieConsent(visitorId: string, preferences: CookiePreferences): Promise<boolean> {
    try {
      const res = await apiClient.post('/cookies/consent', { visitor_id: visitorId, preferences });
      return res.status === 200;
    } catch {
      return false;
    }
  },

  async getPrivacyPreferences(): Promise<PrivacyPreferences> {
    const res = await apiClient.get<PrivacyPreferences>('/privacy');
    return res.data;
    
  },

  async updatePrivacyPreferences(payload: Partial<PrivacyPreferences>): Promise<PrivacyPreferences> {
    const res = await apiClient.put<PrivacyPreferences>('/privacy', payload);
    return res.data;
  },

  async getConsentHistory(): Promise<ConsentHistoryItem[]> {
    const res = await apiClient.get<ConsentHistoryItem[]>('/privacy/consents');
    return res.data;
    
  },

  async requestDataExport(): Promise<DataExportJob> {
    const res = await apiClient.post<DataExportJob>('/privacy/export');
    return res.data;
  },

  async getDataExportJob(): Promise<DataExportJob> {
    const res = await apiClient.get<DataExportJob>('/privacy/export');
    return res.data;
    
  },

  async requestAccountDeletion(reason: string): Promise<any> {
    const res = await apiClient.post('/privacy/delete-account', { reason });
    return res.data;
  },

  async cancelAccountDeletion(): Promise<boolean> {
    const res = await apiClient.post('/privacy/delete-account/cancel');
    return res.status === 200;
  },

  async getPrivacyRequests(): Promise<PrivacyRequest[]> {
    const res = await apiClient.get<PrivacyRequest[]>('/privacy/requests');
    return res.data;
    
  },

  async getAdminPrivacySummary(): Promise<PrivacyDashboardSummary> {
    const res = await apiClient.get<PrivacyDashboardSummary>('/admin/privacy');
    return res.data;
    
  },

  async getDataProcessingRecords(): Promise<DataProcessingRecord[]> {
    const res = await apiClient.get<DataProcessingRecord[]>('/admin/privacy/data-processing');
    return res.data;
    
  },

  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    const res = await apiClient.get<RetentionPolicy[]>('/privacy/retention');
    return res.data;
    
  },

  async getThirdPartyServices(): Promise<ThirdPartyService[]> {
    const res = await apiClient.get<ThirdPartyService[]>('/admin/privacy/third-parties');
    return res.data;
    
  },
};
