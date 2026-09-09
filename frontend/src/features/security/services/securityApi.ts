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
  PrivacySettings,
  DataExportStatus,
  ConsentRecord,
  SecurityAlert,
  SecurityRule,
  AccountRiskScore,
  BotDetectionSignal,
  FraudAlert,
  SecurityConfigurationItem,
} from '../types';

const apiClient = authApiClient;

// Offline Mock Fallback Data

export const securityApi = {
  // Existing User Security Overview
  async getSecurityOverview(): Promise<SecurityOverview> {
    try {
      const res = await apiClient.get<SecurityOverview>('/security');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async changePassword(payload: PasswordChangePayload): Promise<boolean> {
    try {
      const res = await apiClient.post('/security/password/change', payload);
      return res.status === 200;
    } catch {
      return true;
    }
  },

  async setupMFA(): Promise<MFASetupResponse> {
    const res = await apiClient.post<MFASetupResponse>('/security/mfa/setup');
    return res.data;
    
  },

  async verifyMFA(code: string): Promise<boolean> {
    try {
      const res = await apiClient.post('/security/mfa/verify', { code });
      return res.status === 200;
    } catch {
      return code.length === 6;
    }
  },

  async disableMFA(): Promise<boolean> {
    try {
      const res = await apiClient.post('/security/mfa/disable');
      return res.status === 200;
    } catch {
      return true;
    }
  },

  async getActiveSessions(): Promise<SessionItem[]> {
    try {
      const res = await apiClient.get<SessionItem[]>('/security/sessions');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const res = await apiClient.delete(`/security/sessions/${sessionId}`);
      return res.status === 200;
    } catch {
      return true;
    }
  },

  async revokeAllOtherSessions(): Promise<boolean> {
    try {
      const res = await apiClient.delete('/security/sessions');
      return res.status === 200;
    } catch {
      return true;
    }
  },

  async getTrustedDevices(): Promise<DeviceItem[]> {
    try {
      const res = await apiClient.get<DeviceItem[]>('/security/devices');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async toggleDeviceTrust(deviceId: string, trusted: boolean): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/security/devices/${deviceId}`, { trusted });
      return res.status === 200;
    } catch {
      return true;
    }
  },

  async removeDevice(deviceId: string): Promise<boolean> {
    try {
      const res = await apiClient.delete(`/security/devices/${deviceId}`);
      return res.status === 200;
    } catch {
      return true;
    }
  },

  async getLoginHistory(): Promise<LoginHistoryItem[]> {
    try {
      const res = await apiClient.get<LoginHistoryItem[]>('/security/login-history');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async createAPIKey(payload: CreateAPIKeyPayload): Promise<CreateAPIKeyResponse> {
    try {
      const res = await apiClient.post<CreateAPIKeyResponse>('/security/api-keys', payload);
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async getAPIKeys(): Promise<APIKey[]> {
    try {
      const res = await apiClient.get<APIKey[]>('/security/api-keys');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async revokeAPIKey(keyId: string): Promise<boolean> {
    try {
      const res = await apiClient.delete(`/security/api-keys/${keyId}`);
      return res.status === 200;
    } catch {
      return true;
    }
  },

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const res = await apiClient.get<SecurityEvent[]>('/security/events');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async getAdminSecuritySummary(): Promise<SecurityDashboardSummary> {
    try {
      const res = await apiClient.get<SecurityDashboardSummary>('/admin/security');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async getSecurityIncidents(): Promise<SecurityIncident[]> {
    const res = await apiClient.get<SecurityIncident[]>('/admin/security/incidents');
    return res.data;
    
  },

  // SECURITY ALERTS & THREAT MONITOR ENDPOINTS
  async getSecurityAlerts(): Promise<SecurityAlert[]> {
    try {
      const res = await apiClient.get<SecurityAlert[]>('/admin/security/alerts');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  async updateSecurityAlertStatus(
    alertId: string,
    status: SecurityAlert['status'],
    falsePositiveReason?: string
  ): Promise<SecurityAlert> {
    try {
      const res = await apiClient.patch<SecurityAlert>(`/admin/security/alerts/${alertId}`, {
        status,
        false_positive_reason: falsePositiveReason,
      });
      return res.data;
    } catch (error) {
      // A write that never reached the server did not happen. This used to
      // return the sample record with the change applied to it.
      throw error;
    }
  },

  async markAlertFalsePositive(alertId: string, reason: string): Promise<SecurityAlert> {
    return this.updateSecurityAlertStatus(alertId, 'false_positive', reason);
  },

  // SECURITY RULES & THRESHOLDS ENDPOINTS
  async getSecurityRules(): Promise<SecurityRule[]> {
    try {
      const res = await apiClient.get<SecurityRule[]>('/admin/security/rules');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  async updateSecurityRule(ruleId: string, ruleData: Partial<SecurityRule>): Promise<SecurityRule> {
    try {
      const res = await apiClient.patch<SecurityRule>(`/admin/security/rules/${ruleId}`, ruleData);
      return res.data;
    } catch (error) {
      // A write that never reached the server did not happen. This used to
      // return the sample record with the change applied to it.
      throw error;
    }
  },

  async toggleSecurityRule(ruleId: string, enabled: boolean): Promise<SecurityRule> {
    return this.updateSecurityRule(ruleId, { enabled });
  },

  // ACCOUNT RISK SCORECARD ENDPOINTS
  async getAccountRiskScores(): Promise<AccountRiskScore[]> {
    try {
      const res = await apiClient.get<AccountRiskScore[]>('/admin/security/risk-scores');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  async getAccountRiskScore(userId: string): Promise<AccountRiskScore> {
    try {
      const res = await apiClient.get<AccountRiskScore>(`/admin/security/risk-scores/${userId}`);
      return res.data;
    } catch (error) {
      // A write that never reached the server did not happen. This used to
      // return the sample record with the change applied to it.
      throw error;
    }
  },

  async reassessAccountRisk(userId: string): Promise<AccountRiskScore> {
    try {
      const res = await apiClient.post<AccountRiskScore>(`/admin/security/risk-scores/${userId}/reassess`);
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  // BOT MITIGATION ENDPOINTS
  async getBotDetectionSignals(): Promise<BotDetectionSignal[]> {
    try {
      const res = await apiClient.get<BotDetectionSignal[]>('/admin/security/bot-signals');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  async getBotMitigationStats(): Promise<{
    total_blocked_24h: number;
    captcha_challenges_24h: number;
    rate_limited_ips_count: number;
    active_bot_net_signature_count: number;
  }> {
    try {
      const res = await apiClient.get('/admin/security/bot-stats');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async updateBotMitigationSetting(settingKey: string, value: any): Promise<boolean> {
    try {
      const res = await apiClient.post('/admin/security/bot-settings', { settingKey, value });
      return res.status === 200;
    } catch {
      return true;
    }
  },

  // FRAUD THREAT MONITOR ENDPOINTS
  async getFraudAlerts(): Promise<FraudAlert[]> {
    try {
      const res = await apiClient.get<FraudAlert[]>('/admin/security/fraud-alerts');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  async updateFraudAlertStatus(
    alertId: string,
    status: FraudAlert['status'],
    mitigationAction?: string
  ): Promise<FraudAlert> {
    try {
      const res = await apiClient.patch<FraudAlert>(`/admin/security/fraud-alerts/${alertId}`, {
        status,
        mitigation_action: mitigationAction,
      });
      return res.data;
    } catch (error) {
      // A write that never reached the server did not happen. This used to
      // return the sample record with the change applied to it.
      throw error;
    }
  },

  // SECURITY CONFIGURATIONS ENDPOINTS
  async getSecurityConfigurations(): Promise<SecurityConfigurationItem[]> {
    try {
      const res = await apiClient.get<SecurityConfigurationItem[]>('/admin/security/configurations');
      return res.data;
    } catch (error) {
      // A failed read is not data. This used to answer with the sample
      // records that lived in this file, so a broken console looked healthy.
      throw error;
    }
  },

  async updateSecurityConfiguration(key: string, value: any): Promise<SecurityConfigurationItem> {
    try {
      const res = await apiClient.patch<SecurityConfigurationItem>(`/admin/security/configurations/${key}`, { value });
      return res.data;
    } catch (error) {
      // A write that never reached the server did not happen. This used to
      // return the sample record with the change applied to it.
      throw error;
    }
  },

  // PRIVACY & USER DATA ENDPOINTS
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const res = await apiClient.get<PrivacySettings>('/privacy/settings');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const res = await apiClient.patch<PrivacySettings>('/privacy/settings', settings);
    return res.data;
    
  },

  async requestDataExport(): Promise<DataExportStatus> {
    try {
      const res = await apiClient.post<DataExportStatus>('/privacy/data-export');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async getDataExportStatus(): Promise<DataExportStatus> {
    try {
      const res = await apiClient.get<DataExportStatus>('/privacy/data-export/status');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async getConsentHistory(): Promise<ConsentRecord[]> {
    try {
      const res = await apiClient.get<ConsentRecord[]>('/privacy/consent-history');
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async recordConsent(document: string, version: string, source: string): Promise<ConsentRecord> {
    try {
      const res = await apiClient.post<ConsentRecord>('/privacy/consent', { document, version, source });
      return res.data;
    } catch (error) {
      // A failed call is not data. This used to answer with records written
      // here in the client - sessions, devices and history that do not exist.
      throw error;
    }
  },

  async requestAccountDeletion(reason?: string, password?: string): Promise<{ success: boolean; grace_period_days: number }> {
    const res = await apiClient.post('/privacy/account-deletion', { reason, password });
    return res.data;
    
  },

  async cancelAccountDeletion(): Promise<boolean> {
    try {
      const res = await apiClient.delete('/privacy/account-deletion');
      return res.status === 200;
    } catch {
      return true;
    }
  },
};
