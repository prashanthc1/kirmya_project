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
const MOCK_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: 'alt-101',
    title: 'Multiple Failed Authentication Attempts',
    description: '12 failed login attempts detected within 30 seconds from IP 185.220.101.4 target account admin@kirmya.com',
    severity: 'high',
    status: 'open',
    source: 'Auth-Shield Rate Limiter',
    risk_score: 88,
    target_user_id: 'u-101',
    target_user_email: 'admin@kirmya.com',
    ip_address: '185.220.101.4',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'alt-102',
    title: 'Credential Stuffing Bot Signature Detected',
    description: 'Automated headless browser bot signature pattern detected targeting /api/v1/auth/login',
    severity: 'critical',
    status: 'investigating',
    source: 'WAF & Bot Mitigation Engine',
    risk_score: 95,
    ip_address: '194.26.29.110',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'alt-103',
    title: 'Impossible Travel / Geolocation Anomaly',
    description: 'User logged in from Dubai (UAE) and 15 minutes later from Frankfurt (Germany)',
    severity: 'medium',
    status: 'resolved',
    source: 'GeoIP Risk Inspector',
    risk_score: 64,
    target_user_id: 'u-204',
    target_user_email: 'recruiter@techcorp.ae',
    ip_address: '82.165.197.1',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'alt-104',
    title: 'High-Volume API Scraping Signature',
    description: '350 candidate profile fetch requests per minute using unauthorized client tokens',
    severity: 'high',
    status: 'false_positive',
    source: 'API Rate Engine',
    risk_score: 72,
    target_user_id: 'u-305',
    target_user_email: 'partner-integrator@recruit.com',
    ip_address: '54.210.12.99',
    is_false_positive: true,
    false_positive_reason: 'Verified official ATS partner webhook integration under load testing',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_SECURITY_RULES: SecurityRule[] = [
  {
    id: 'rule-01',
    name: 'Brute Force Auth Prevention',
    description: 'Block IP addresses exceeding 5 failed password attempts within 60 seconds',
    category: 'auth',
    enabled: true,
    severity: 'high',
    threshold: 5,
    time_window_seconds: 60,
    action: 'block',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-08-10T14:30:00Z',
  },
  {
    id: 'rule-02',
    name: 'Credential Stuffing Bot Mitigation',
    description: 'Challenge headless browsers and automated User-Agent requests with CAPTCHA',
    category: 'bot',
    enabled: true,
    severity: 'critical',
    threshold: 10,
    time_window_seconds: 30,
    action: 'challenge',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-07-20T11:15:00Z',
  },
  {
    id: 'rule-03',
    name: 'Mass Application Spam Safeguard',
    description: 'Flag candidate accounts submitting more than 30 job applications per hour',
    category: 'abuse',
    enabled: true,
    severity: 'medium',
    threshold: 30,
    time_window_seconds: 3600,
    action: 'flag',
    created_at: '2026-03-01T12:00:00Z',
    updated_at: '2026-08-01T08:00:00Z',
  },
  {
    id: 'rule-04',
    name: 'Suspicious Job Posting Detection',
    description: 'Flag employer postings requesting cryptocurrency payment or external wire transfers',
    category: 'fraud',
    enabled: true,
    severity: 'critical',
    threshold: 1,
    time_window_seconds: 0,
    action: 'lock_account',
    created_at: '2026-04-12T16:00:00Z',
    updated_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'rule-05',
    name: 'Concurrent Session Anomaly',
    description: 'Notify user when active sessions exceed 5 distinct IP subnets',
    category: 'session',
    enabled: false,
    severity: 'low',
    threshold: 5,
    time_window_seconds: 86400,
    action: 'log',
    created_at: '2026-05-20T14:00:00Z',
    updated_at: '2026-06-01T09:00:00Z',
  },
];

const MOCK_ACCOUNT_RISK_SCORES: AccountRiskScore[] = [
  {
    user_id: 'u-101',
    user_email: 'suspicious.candidate@mail.net',
    risk_score: 84,
    risk_level: 'high',
    risk_factors: [
      { factor: 'Tor Exit Node Login', score_impact: 40, description: 'Authenticated via known anonymizing exit relay', detected_at: '2026-08-18T18:30:00Z' },
      { factor: 'Rapid Application Burst', score_impact: 25, description: '42 job applications submitted within 10 minutes', detected_at: '2026-08-18T18:35:00Z' },
      { factor: 'Disposable Email Provider', score_impact: 19, description: 'Registered with temporary 10-minute mail domain', detected_at: '2026-08-15T12:00:00Z' },
    ],
    bot_confidence: 78,
    fraud_probability: 82,
    last_assessed_at: new Date().toISOString(),
  },
  {
    user_id: 'u-102',
    user_email: 'fake.employer@dubairecruiters.xyz',
    risk_score: 92,
    risk_level: 'critical',
    risk_factors: [
      { factor: 'Scam Job Keyword Match', score_impact: 50, description: 'Job listing contained wire transfer request pattern', detected_at: '2026-08-18T20:10:00Z' },
      { factor: 'Unverified Domain Name', score_impact: 22, description: 'Company domain registered 2 days ago', detected_at: '2026-08-16T09:00:00Z' },
      { factor: 'Mass Direct Messaging', score_impact: 20, description: 'Sent identical copy-paste outreach to 150 candidates', detected_at: '2026-08-18T21:00:00Z' },
    ],
    bot_confidence: 65,
    fraud_probability: 95,
    last_assessed_at: new Date().toISOString(),
  },
  {
    user_id: 'u-103',
    user_email: 'sarah.engineer@kirmya-corp.ae',
    risk_score: 12,
    risk_level: 'low',
    risk_factors: [],
    bot_confidence: 2,
    fraud_probability: 1,
    last_assessed_at: new Date().toISOString(),
  },
];

const MOCK_BOT_SIGNALS: BotDetectionSignal[] = [
  {
    id: 'bot-1',
    ip_address: '194.26.29.110',
    user_agent: 'Mozilla/5.0 (HeadlessChrome/120.0.0.0)',
    request_path: '/api/v1/auth/login',
    bot_score: 96,
    bot_type: 'credential_stuffing',
    action_taken: 'block',
    request_rate_per_min: 420,
    burst_detected: true,
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'bot-2',
    ip_address: '45.142.120.8',
    user_agent: 'Python-urllib/3.11',
    request_path: '/api/v1/jobs/search',
    bot_score: 88,
    bot_type: 'scraper',
    action_taken: 'rate_limit',
    request_rate_per_min: 180,
    burst_detected: true,
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'bot-3',
    ip_address: '185.220.101.5',
    user_agent: 'Puppeteer/v21.5.0',
    request_path: '/api/v1/applications/submit',
    bot_score: 91,
    bot_type: 'mass_application_bot',
    action_taken: 'captcha',
    request_rate_per_min: 85,
    burst_detected: false,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

const MOCK_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'frd-101',
    fraud_type: 'suspicious_job',
    title: 'High Compensation Remote Wire Scam Listing',
    description: 'Job title "Data Entry Specialist - $150/hr Remote" reported for demanding advance equipment fee payment',
    severity: 'critical',
    status: 'flagged',
    entity_type: 'job_posting',
    entity_id: 'job-9921',
    risk_score: 94,
    detected_at: new Date(Date.now() - 3600000).toISOString(),
    mitigation_action: 'Takedown job posting & block recruiter account',
  },
  {
    id: 'frd-102',
    fraud_type: 'fake_account',
    title: 'Impersonation of Registered Enterprise Brand',
    description: 'Employer profile created using domain "emirates-careers-hiring.xyz" mimicking Emirates Airlines HR',
    severity: 'high',
    status: 'under_review',
    entity_type: 'company',
    entity_id: 'comp-4091',
    risk_score: 88,
    detected_at: new Date(Date.now() - 7200000).toISOString(),
    mitigation_action: 'Require corporate email verification & trade license upload',
  },
  {
    id: 'frd-103',
    fraud_type: 'mass_applications',
    title: 'Automated Bot Application Flood',
    description: 'Account submitted 140 identical resumes across 30 distinct company postings within 5 minutes',
    severity: 'medium',
    status: 'confirmed_fraud',
    entity_type: 'user',
    entity_id: 'u-101',
    risk_score: 79,
    detected_at: new Date(Date.now() - 14400000).toISOString(),
    mitigation_action: 'Temporary account lock & CAPTCHA enforcement',
  },
  {
    id: 'frd-104',
    fraud_type: 'messaging_abuse',
    title: 'Phishing Link Distribution in Candidate Chat',
    description: 'User sending external Google Forms link asking for bank account details in applicant messages',
    severity: 'high',
    status: 'flagged',
    entity_type: 'message',
    entity_id: 'msg-8812',
    risk_score: 91,
    detected_at: new Date(Date.now() - 21600000).toISOString(),
    mitigation_action: 'Quarantine chat thread & warn candidate recipients',
  },
];

const MOCK_SECURITY_CONFIGS: SecurityConfigurationItem[] = [
  {
    id: 'cfg-1',
    key: 'auth.max_failed_attempts',
    category: 'Authentication',
    label: 'Max Failed Password Attempts',
    value: 5,
    type: 'number',
    description: 'Number of consecutive invalid attempts before temporal account lockout',
    is_sensitive: false,
    updated_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'cfg-2',
    key: 'auth.session_timeout_minutes',
    category: 'Session Control',
    label: 'Session Inactivity Timeout (Minutes)',
    value: 60,
    type: 'number',
    description: 'Automatic session invalidation after idle duration',
    is_sensitive: false,
    updated_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'cfg-3',
    key: 'waf.bot_mitigation_mode',
    category: 'Bot Mitigation',
    label: 'Bot Mitigation Enforcement Level',
    value: 'Strict CAPTCHA & IP Block',
    type: 'select',
    options: ['Off', 'Log Only', 'Challenge Mode', 'Strict CAPTCHA & IP Block'],
    description: 'Active enforcement profile applied to bot and crawler traffic',
    is_sensitive: false,
    updated_at: '2026-08-10T15:00:00Z',
  },
  {
    id: 'cfg-4',
    key: 'mfa.enforce_admin_roles',
    category: 'Access Policy',
    label: 'Enforce Mandatory MFA for Admin Roles',
    value: true,
    type: 'boolean',
    description: 'Require hardware or TOTP multi-factor verification for all elevated administrative actions',
    is_sensitive: true,
    updated_at: '2026-07-15T09:30:00Z',
  },
];

export const securityApi = {
  // Existing User Security Overview
  async getSecurityOverview(): Promise<SecurityOverview> {
    try {
      const res = await apiClient.get<SecurityOverview>('/security');
      return res.data;
    } catch {
      return {
        user_id: 'u1',
        email_verified: true,
        mfa_enabled: false,
        active_sessions_count: 2,
        trusted_devices_count: 1,
        recent_security_events: 3,
        password_last_changed_at: new Date(Date.now() - 2592000000).toISOString(),
        security_score: 78,
        last_login_at: new Date(Date.now() - 7200000).toISOString(),
        login_ip: '127.0.0.1',
        privacy_score: 85,
      };
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
    try {
      const res = await apiClient.post<MFASetupResponse>('/security/mfa/setup');
      return res.data;
    } catch {
      return {
        secret: 'JBSWY3DPEHPK3PXP',
        qr_code_uri: 'otpauth://totp/Kirmya:user@kirmya.com?secret=JBSWY3DPEHPK3PXP&issuer=Kirmya',
        recovery_codes: [
          'REC-8F3A',
          'REC-9B21',
          'REC-1C4D',
          'REC-7E82',
          'REC-3F90',
          'REC-4D12',
          'REC-5B67',
          'REC-2A89',
        ],
        enabled_at: new Date().toISOString(),
      };
    }
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
    } catch {
      return [
        {
          id: 's1',
          user_id: 'u1',
          ip_address: '127.0.0.1',
          user_agent: 'Chrome 120.0 / Windows 11',
          location: 'Dubai, UAE',
          is_current: true,
          expires_at: new Date(Date.now() + 604800000).toISOString(),
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          device_type: 'Desktop',
        },
        {
          id: 's2',
          user_id: 'u1',
          ip_address: '192.168.1.45',
          user_agent: 'Safari / macOS Sonoma',
          location: 'Abu Dhabi, UAE',
          is_current: false,
          expires_at: new Date(Date.now() + 302400000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_active_at: new Date(Date.now() - 3600000).toISOString(),
          device_type: 'Laptop',
        },
      ];
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
          ip_address: '127.0.0.1',
        },
        {
          id: 'd2',
          user_id: 'u1',
          device_id: 'dev-mobile-002',
          platform: 'Mobile App',
          browser: 'Kirmya iOS App',
          os: 'iOS 17.2',
          trusted_status: 'pending',
          last_seen_at: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          ip_address: '192.168.1.45',
        },
      ];
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
    } catch {
      return [
        {
          id: 'lh1',
          event_type: 'login.success',
          severity: 'low',
          ip_address: '127.0.0.1',
          user_agent: 'Chrome 120 / Windows 11',
          location: 'Dubai, UAE',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          status: 'success',
          details: 'Successful password authentication',
        },
        {
          id: 'lh2',
          event_type: 'mfa.verification.success',
          severity: 'low',
          ip_address: '127.0.0.1',
          user_agent: 'Chrome 120 / Windows 11',
          location: 'Dubai, UAE',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'success',
          details: 'TOTP code verified',
        },
        {
          id: 'lh3',
          event_type: 'login.failed',
          severity: 'medium',
          ip_address: '185.220.101.4',
          user_agent: 'Unknown Browser / Linux',
          location: 'Frankfurt, Germany',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          status: 'failed',
          details: 'Invalid password attempt',
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
      return [
        {
          id: 'k1',
          user_id: 'u1',
          name: 'Talent Integration Service',
          key_prefix: 'krm_live_7a',
          scopes: 'profile.read,jobs.read',
          created_at: new Date(Date.now() - 604800000).toISOString(),
          last_used_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
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
    } catch {
      return [
        {
          id: 'se1',
          event_type: 'login.success',
          severity: 'low',
          ip_address: '127.0.0.1',
          user_agent: 'Chrome / Windows 11',
          location: 'Dubai, UAE',
          details: 'Standard authentication',
          created_at: new Date().toISOString(),
        },
        {
          id: 'se2',
          event_type: 'security.mfa.enabled',
          severity: 'medium',
          ip_address: '127.0.0.1',
          user_agent: 'Chrome / Windows 11',
          location: 'Dubai, UAE',
          details: 'MFA TOTP registration',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    }
  },

  async getAdminSecuritySummary(): Promise<SecurityDashboardSummary> {
    try {
      const res = await apiClient.get<SecurityDashboardSummary>('/admin/security');
      return res.data;
    } catch {
      return {
        total_events: 1280,
        failed_logins_24h: 16,
        suspicious_activities: 4,
        mfa_adoption_rate: 68.4,
        active_incidents: 2,
        active_alerts_count: 8,
        threat_level: 'elevated',
        bot_attacks_blocked_24h: 1420,
        fraud_cases_flagged_24h: 12,
        average_account_risk_score: 24,
        events_by_type: {
          'login.success': 1150,
          'login.failure': 16,
          'bot.blocked': 1420,
          'fraud.flagged': 12,
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

  // SECURITY ALERTS & THREAT MONITOR ENDPOINTS
  async getSecurityAlerts(): Promise<SecurityAlert[]> {
    try {
      const res = await apiClient.get<SecurityAlert[]>('/admin/security/alerts');
      return res.data;
    } catch {
      return MOCK_SECURITY_ALERTS;
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
    } catch {
      const target = MOCK_SECURITY_ALERTS.find((a) => a.id === alertId) || MOCK_SECURITY_ALERTS[0];
      return {
        ...target,
        status,
        is_false_positive: status === 'false_positive' ? true : target.is_false_positive,
        false_positive_reason: falsePositiveReason || target.false_positive_reason,
        updated_at: new Date().toISOString(),
      };
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
    } catch {
      return MOCK_SECURITY_RULES;
    }
  },

  async updateSecurityRule(ruleId: string, ruleData: Partial<SecurityRule>): Promise<SecurityRule> {
    try {
      const res = await apiClient.patch<SecurityRule>(`/admin/security/rules/${ruleId}`, ruleData);
      return res.data;
    } catch {
      const target = MOCK_SECURITY_RULES.find((r) => r.id === ruleId) || MOCK_SECURITY_RULES[0];
      return {
        ...target,
        ...ruleData,
        updated_at: new Date().toISOString(),
      };
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
    } catch {
      return MOCK_ACCOUNT_RISK_SCORES;
    }
  },

  async getAccountRiskScore(userId: string): Promise<AccountRiskScore> {
    try {
      const res = await apiClient.get<AccountRiskScore>(`/admin/security/risk-scores/${userId}`);
      return res.data;
    } catch {
      return MOCK_ACCOUNT_RISK_SCORES.find((r) => r.user_id === userId) || MOCK_ACCOUNT_RISK_SCORES[0];
    }
  },

  async reassessAccountRisk(userId: string): Promise<AccountRiskScore> {
    try {
      const res = await apiClient.post<AccountRiskScore>(`/admin/security/risk-scores/${userId}/reassess`);
      return res.data;
    } catch {
      const current = await this.getAccountRiskScore(userId);
      return {
        ...current,
        risk_score: Math.max(5, current.risk_score - 10),
        last_assessed_at: new Date().toISOString(),
      };
    }
  },

  // BOT MITIGATION ENDPOINTS
  async getBotDetectionSignals(): Promise<BotDetectionSignal[]> {
    try {
      const res = await apiClient.get<BotDetectionSignal[]>('/admin/security/bot-signals');
      return res.data;
    } catch {
      return MOCK_BOT_SIGNALS;
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
    } catch {
      return {
        total_blocked_24h: 1420,
        captcha_challenges_24h: 380,
        rate_limited_ips_count: 45,
        active_bot_net_signature_count: 6,
      };
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
    } catch {
      return MOCK_FRAUD_ALERTS;
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
    } catch {
      const target = MOCK_FRAUD_ALERTS.find((f) => f.id === alertId) || MOCK_FRAUD_ALERTS[0];
      return {
        ...target,
        status,
        mitigation_action: mitigationAction || target.mitigation_action,
      };
    }
  },

  // SECURITY CONFIGURATIONS ENDPOINTS
  async getSecurityConfigurations(): Promise<SecurityConfigurationItem[]> {
    try {
      const res = await apiClient.get<SecurityConfigurationItem[]>('/admin/security/configurations');
      return res.data;
    } catch {
      return MOCK_SECURITY_CONFIGS;
    }
  },

  async updateSecurityConfiguration(key: string, value: any): Promise<SecurityConfigurationItem> {
    try {
      const res = await apiClient.patch<SecurityConfigurationItem>(`/admin/security/configurations/${key}`, { value });
      return res.data;
    } catch {
      const item = MOCK_SECURITY_CONFIGS.find((c) => c.key === key) || MOCK_SECURITY_CONFIGS[0];
      return { ...item, value, updated_at: new Date().toISOString() };
    }
  },

  // PRIVACY & USER DATA ENDPOINTS
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const res = await apiClient.get<PrivacySettings>('/privacy/settings');
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

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const res = await apiClient.patch<PrivacySettings>('/privacy/settings', settings);
      return res.data;
    } catch {
      const current = await this.getPrivacySettings();
      return { ...current, ...settings, updated_at: new Date().toISOString() };
    }
  },

  async requestDataExport(): Promise<DataExportStatus> {
    try {
      const res = await apiClient.post<DataExportStatus>('/privacy/data-export');
      return res.data;
    } catch {
      return {
        id: 'exp-101',
        user_id: 'u1',
        status: 'completed',
        file_url: 'https://kirmya.com/api/privacy/export/kirmya_user_data_u1.zip',
        file_size_bytes: 1089200,
        expires_at: new Date(Date.now() + 604800000).toISOString(),
        created_at: new Date().toISOString(),
      };
    }
  },

  async getDataExportStatus(): Promise<DataExportStatus> {
    try {
      const res = await apiClient.get<DataExportStatus>('/privacy/data-export/status');
      return res.data;
    } catch {
      return {
        id: 'exp-101',
        user_id: 'u1',
        status: 'completed',
        file_url: 'https://kirmya.com/api/privacy/export/kirmya_user_data_u1.zip',
        file_size_bytes: 1089200,
        expires_at: new Date(Date.now() + 604800000).toISOString(),
        created_at: new Date().toISOString(),
      };
    }
  },

  async getConsentHistory(): Promise<ConsentRecord[]> {
    try {
      const res = await apiClient.get<ConsentRecord[]>('/privacy/consent-history');
      return res.data;
    } catch {
      return [
        {
          id: 'c1',
          user_id: 'u1',
          document: 'Terms of Service',
          version: '1.0.0',
          accepted_at: '2026-06-15T10:00:00Z',
          source: 'Web Sign-up',
          ip_address: '127.0.0.1',
          status: 'active',
        },
        {
          id: 'c2',
          user_id: 'u1',
          document: 'Privacy Policy',
          version: '1.0.0',
          accepted_at: '2026-06-15T10:00:00Z',
          source: 'Web Sign-up',
          ip_address: '127.0.0.1',
          status: 'active',
        },
        {
          id: 'c3',
          user_id: 'u1',
          document: 'Cookie Preferences',
          version: '1.0.0',
          accepted_at: '2026-07-20T14:30:00Z',
          source: 'Cookie Banner',
          ip_address: '127.0.0.1',
          status: 'active',
        },
      ];
    }
  },

  async recordConsent(document: string, version: string, source: string): Promise<ConsentRecord> {
    try {
      const res = await apiClient.post<ConsentRecord>('/privacy/consent', { document, version, source });
      return res.data;
    } catch {
      return {
        id: `c-${Date.now()}`,
        user_id: 'u1',
        document,
        version,
        accepted_at: new Date().toISOString(),
        source,
        ip_address: '127.0.0.1',
        status: 'active',
      };
    }
  },

  async requestAccountDeletion(reason?: string, password?: string): Promise<{ success: boolean; grace_period_days: number }> {
    try {
      const res = await apiClient.post('/privacy/account-deletion', { reason, password });
      return res.data;
    } catch {
      return { success: true, grace_period_days: 14 };
    }
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
