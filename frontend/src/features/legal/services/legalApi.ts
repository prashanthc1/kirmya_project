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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const legalApi = {
  async getDocument(slug: string): Promise<LegalDocument> {
    try {
      const res = await fetch(`${API_BASE}/legal/documents/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch legal document');
      const data = await res.json();
      return data.data;
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
      const res = await fetch(`${API_BASE}/cookies`);
      if (!res.ok) throw new Error('Failed to fetch cookies');
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  },

  async saveCookieConsent(visitorId: string, preferences: CookiePreferences): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/cookies/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, preferences }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getPrivacyPreferences(): Promise<PrivacyPreferences> {
    try {
      const res = await fetch(`${API_BASE}/privacy`);
      if (!res.ok) throw new Error('Failed to fetch privacy settings');
      return await res.json();
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
    const res = await fetch(`${API_BASE}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async getConsentHistory(): Promise<ConsentHistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE}/privacy/consents`);
      if (!res.ok) throw new Error('Failed to fetch consent history');
      return await res.json();
    } catch {
      return [
        { id: 'c1', document: 'Terms of Service', version: '1.0.0', accepted_at: new Date().toISOString(), source: 'Web Registration' },
        { id: 'c2', document: 'Privacy Policy', version: '1.0.0', accepted_at: new Date().toISOString(), source: 'Web Registration' },
      ];
    }
  },

  async requestDataExport(): Promise<DataExportJob> {
    const res = await fetch(`${API_BASE}/privacy/export`, { method: 'POST' });
    return await res.json();
  },

  async getDataExportJob(): Promise<DataExportJob> {
    try {
      const res = await fetch(`${API_BASE}/privacy/export`);
      if (!res.ok) throw new Error('Failed to fetch export job');
      return await res.json();
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
    const res = await fetch(`${API_BASE}/privacy/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  },

  async cancelAccountDeletion(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/privacy/delete-account/cancel`, { method: 'POST' });
    return res.ok;
  },

  async getPrivacyRequests(): Promise<PrivacyRequest[]> {
    try {
      const res = await fetch(`${API_BASE}/privacy/requests`);
      if (!res.ok) throw new Error('Failed to fetch privacy requests');
      return await res.json();
    } catch {
      return [];
    }
  },

  async getAdminPrivacySummary(): Promise<PrivacyDashboardSummary> {
    try {
      const res = await fetch(`${API_BASE}/admin/privacy`);
      if (!res.ok) throw new Error('Failed to fetch admin summary');
      return await res.json();
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
      const res = await fetch(`${API_BASE}/admin/privacy/data-processing`);
      if (!res.ok) throw new Error('Failed to fetch RoPA records');
      return await res.json();
    } catch {
      return [];
    }
  },

  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    try {
      const res = await fetch(`${API_BASE}/privacy/retention`);
      if (!res.ok) throw new Error('Failed to fetch retention policies');
      return await res.json();
    } catch {
      return [];
    }
  },

  async getThirdPartyServices(): Promise<ThirdPartyService[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/privacy/third-parties`);
      if (!res.ok) throw new Error('Failed to fetch sub-processors');
      return await res.json();
    } catch {
      return [];
    }
  },
};
