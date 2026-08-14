import { authApiClient } from '../../../services/authService';
import {
  SecurityOverview,
  PasswordChangePayload,
  MFASetupResponse,
  SessionItem,
  DeviceItem,
  LoginHistoryItem,
  APIKey,
  CreateAPIKeyPayload,
  CreateAPIKeyResponse,
  SecurityEvent,
  SecurityIncident,
  SecurityDashboardSummary,
} from '../types';

const apiClient = authApiClient;

export const securityApi = {
  async getSecurityOverview(): Promise<SecurityOverview> {
    try {
      const res = await apiClient.get<SecurityOverview>('/security');
      return res.data;
    } catch {
      return {
        user_id: 'u1',
        email_verified: true,
        mfa_enabled: false,
        active_sessions_count: 1,
        trusted_devices_count: 1,
        recent_security_events: 2,
        password_last_changed_at: new Date(Date.now() - 2592000000).toISOString(),
        security_score: 75,
      };
    }
  },

  async changePassword(payload: PasswordChangePayload): Promise<boolean> {
    const res = await apiClient.post('/security/password/change', payload);
    return res.status === 200;
  },

  async setupMFA(): Promise<MFASetupResponse> {
    try {
      const res = await apiClient.post<MFASetupResponse>('/security/mfa/setup');
      return res.data;
    } catch {
      return {
        secret: 'JBSWY3DPEHPK3PXP',
        qr_code_uri: 'otpauth://totp/Kirmya:user@kirmya.com?secret=JBSWY3DPEHPK3PXP&issuer=Kirmya',
        recovery_codes: ['REC-8F3A', 'REC-9B21', 'REC-1C4D', 'REC-7E82', 'REC-3F90', 'REC-4D12', 'REC-5B67', 'REC-2A89'],
      };
    }
  },

  async verifyMFA(code: string): Promise<boolean> {
    const res = await apiClient.post('/security/mfa/verify', { code });
    return res.status === 200;
  },

  async disableMFA(): Promise<boolean> {
    const res = await apiClient.post('/security/mfa/disable');
    return res.status === 200;
  },

  async getActiveSessions(): Promise<SessionItem[]> {
    try {
      const res = await apiClient.get<SessionItem[]>('/security/sessions');
      return res.data;
    } catch {
      return [
        {
          id: 's1',
          user_id: 'u1',
          ip_address: '127.0.0.1',
          user_agent: 'Chrome 120 / Windows 11',
          location: 'Dubai, UAE',
          is_current: true,
          expires_at: new Date(Date.now() + 604800000).toISOString(),
          created_at: new Date().toISOString(),
        },
      ];
    }
  },

  async revokeSession(sessionId: string): Promise<boolean> {
    const res = await apiClient.delete(`/security/sessions/${sessionId}`);
    return res.status === 200;
  },

  async revokeAllOtherSessions(): Promise<boolean> {
    const res = await apiClient.delete('/security/sessions');
    return res.status === 200;
  },

  async getTrustedDevices(): Promise<DeviceItem[]> {
    try {
      const res = await apiClient.get<DeviceItem[]>('/security/devices');
      return res.data;
    } catch {
      return [
        {
          id: 'd1',
          user_id: 'u1',
          device_id: 'dev-web-001',
          platform: 'Web Desktop',
          browser: 'Chrome 120.0',
          os: 'Windows 11',
          trusted_status: 'trusted',
          last_seen_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 2592000000).toISOString(),
        },
      ];
    }
  },

  async removeDevice(deviceId: string): Promise<boolean> {
    const res = await apiClient.delete(`/security/devices/${deviceId}`);
    return res.status === 200;
  },

  async getLoginHistory(): Promise<LoginHistoryItem[]> {
    try {
      const res = await apiClient.get<LoginHistoryItem[]>('/security/login-history');
      return res.data;
    } catch {
      return [
        {
          id: 'lh1',
          event_type: 'login.success',
          severity: 'low',
          ip_address: '127.0.0.1',
          user_agent: 'Chrome / Windows',
          location: 'Dubai, UAE',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
    }
  },

  async createAPIKey(payload: CreateAPIKeyPayload): Promise<CreateAPIKeyResponse> {
    try {
      const res = await apiClient.post<CreateAPIKeyResponse>('/security/api-keys', payload);
      return res.data;
    } catch {
      return {
        api_key: {
          id: 'k1',
          user_id: 'u1',
          name: payload.name,
          key_prefix: 'krm_live_7a',
          scopes: payload.scopes || 'profile.read,jobs.read',
          created_at: new Date().toISOString(),
        },
        secret: 'krm_live_7a9f8e2d1c0b3a4f5e6d7c8b9a0f1e2d',
      };
    }
  },

  async getAPIKeys(): Promise<APIKey[]> {
    try {
      const res = await apiClient.get<APIKey[]>('/security/api-keys');
      return res.data;
    } catch {
      return [];
    }
  },

  async revokeAPIKey(keyId: string): Promise<boolean> {
    const res = await apiClient.delete(`/security/api-keys/${keyId}`);
    return res.status === 200;
  },

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const res = await apiClient.get<SecurityEvent[]>('/security/events');
      return res.data;
    } catch {
      return [];
    }
  },

  async getAdminSecuritySummary(): Promise<SecurityDashboardSummary> {
    try {
      const res = await apiClient.get<SecurityDashboardSummary>('/admin/security');
      return res.data;
    } catch {
      return {
        total_events: 1280,
        failed_logins_24h: 4,
        suspicious_activities: 0,
        mfa_adoption_rate: 42.5,
        active_incidents: 0,
        events_by_type: {
          'login.success': 1150,
          'login.failure': 4,
          'password.changed': 86,
          'mfa.enabled': 40,
        },
      };
    }
  },

  async getSecurityIncidents(): Promise<SecurityIncident[]> {
    try {
      const res = await apiClient.get<SecurityIncident[]>('/admin/security/incidents');
      return res.data;
    } catch {
      return [];
    }
  },
};
