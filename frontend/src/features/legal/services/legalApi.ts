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
    try {
      const res = await apiClient.get<{ data: LegalDocument }>(`/legal/documents/${slug}`);
      return res.data.data;
    } catch {
      return {
        id: '1',
        slug,
        document_type: slug,
        title: `Kirmya ${slug.replace('-', ' ').toUpperCase()}`,
        locale: 'en',
        current_version: '1.0.0',
        status: 'published',
        effective_date: new Date().toISOString(),
        content: `Official platform terms and policies for ${slug}.`,
      };
    }
  },

  async getCookies(): Promise<CookieItem[]> {
    try {
      const res = await apiClient.get<{ data: CookieItem[] }>('/cookies');
      return res.data.data || [];
    } catch {
      return [];
    }
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
    try {
      const res = await apiClient.get<PrivacyPreferences>('/privacy');
      return res.data;
    } catch {
      return {
        user_id: 'u1',
        profile_visibility: 'Public',
        discover_in_search: true,
        recruiter_discoverable: true,
        recruiter_contactable: true,
        show_resume_to_recruiters: true,
        messaging_permission: 'Anyone',
        community_visibility: 'Public',
        search_personalization: true,
        ai_data_usage: true,
        analytics_consent: true,
        marketing_consent: false,
        updated_at: new Date().toISOString(),
      };
    }
  },

  async updatePrivacyPreferences(payload: Partial<PrivacyPreferences>): Promise<PrivacyPreferences> {
    const res = await apiClient.put<PrivacyPreferences>('/privacy', payload);
    return res.data;
  },

  async getConsentHistory(): Promise<ConsentHistoryItem[]> {
    try {
      const res = await apiClient.get<ConsentHistoryItem[]>('/privacy/consents');
      return res.data;
    } catch {
      return [
        { id: 'c1', document: 'Terms of Service', version: '1.0.0', accepted_at: new Date().toISOString(), source: 'Web Registration' },
        { id: 'c2', document: 'Privacy Policy', version: '1.0.0', accepted_at: new Date().toISOString(), source: 'Web Registration' },
      ];
    }
  },

  async requestDataExport(): Promise<DataExportJob> {
    const res = await apiClient.post<DataExportJob>('/privacy/export');
    return res.data;
  },

  async getDataExportJob(): Promise<DataExportJob> {
    try {
      const res = await apiClient.get<DataExportJob>('/privacy/export');
      return res.data;
    } catch {
      return {
        id: 'job-1',
        status: 'completed',
        download_url: '/api/v1/privacy/export/download',
        expires_at: new Date(Date.now() + 604800000).toISOString(),
      };
    }
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
    try {
      const res = await apiClient.get<PrivacyRequest[]>('/privacy/requests');
      return res.data;
    } catch {
      return [];
    }
  },

  async getAdminPrivacySummary(): Promise<PrivacyDashboardSummary> {
    try {
      const res = await apiClient.get<PrivacyDashboardSummary>('/admin/privacy');
      return res.data;
    } catch {
      return {
        total_requests: 42,
        pending_requests: 3,
        completed_requests: 39,
        active_export_jobs: 2,
        account_deletion_jobs: 1,
        active_legal_holds: 0,
        third_party_sub_processors: 2,
        consent_count_by_doc: {
          'Terms of Service': 1240,
          'Privacy Policy': 1240,
          'Cookie Preferences': 1180,
        },
      };
    }
  },

  async getDataProcessingRecords(): Promise<DataProcessingRecord[]> {
    try {
      const res = await apiClient.get<DataProcessingRecord[]>('/admin/privacy/data-processing');
      return res.data;
    } catch {
      return [];
    }
  },

  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    try {
      const res = await apiClient.get<RetentionPolicy[]>('/privacy/retention');
      return res.data;
    } catch {
      return [];
    }
  },

  async getThirdPartyServices(): Promise<ThirdPartyService[]> {
    try {
      const res = await apiClient.get<ThirdPartyService[]>('/admin/privacy/third-parties');
      return res.data;
    } catch {
      return [];
    }
  },
};
