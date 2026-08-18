export interface SecurityOverview {
  user_id: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  active_sessions_count: number;
  trusted_devices_count: number;
  recent_security_events: number;
  password_last_changed_at: string;
  security_score: number;
  last_login_at?: string;
  login_ip?: string;
  privacy_score?: number;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

export interface MFASetupResponse {
  secret: string;
  qr_code_uri: string;
  recovery_codes: string[];
  enabled_at?: string;
}

export interface SessionItem {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  location: string;
  is_current: boolean;
  expires_at: string;
  created_at: string;
  last_active_at?: string;
  device_type?: string;
}

export interface DeviceItem {
  id: string;
  user_id: string;
  device_id: string;
  platform: string;
  browser: string;
  os: string;
  trusted_status: 'trusted' | 'pending' | 'revoked';
  last_seen_at: string;
  created_at: string;
  ip_address?: string;
}

export interface LoginHistoryItem {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  user_agent: string;
  location: string;
  created_at: string;
  status?: 'success' | 'failed' | 'blocked';
  details?: string;
}

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  scopes: string;
  expires_at?: string;
  revoked_at?: string;
  last_used_at?: string;
  created_at: string;
}

export interface CreateAPIKeyPayload {
  name: string;
  scopes?: string;
}

export interface CreateAPIKeyResponse {
  api_key: APIKey;
  secret: string;
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  user_agent: string;
  location: string;
  details?: string;
  created_at: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'dismissed';
  source: string;
  risk_score?: number;
  target_user_id?: string;
  target_user_email?: string;
  ip_address?: string;
  is_false_positive?: boolean;
  false_positive_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'rate_limit' | 'bot' | 'fraud' | 'abuse' | 'session';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  time_window_seconds: number;
  action: 'log' | 'flag' | 'challenge' | 'block' | 'lock_account';
  updated_at: string;
  created_at: string;
}

export interface AccountRiskScore {
  user_id: string;
  user_email: string;
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: Array<{
    factor: string;
    score_impact: number;
    description: string;
    detected_at: string;
  }>;
  bot_confidence: number; // 0-100
  fraud_probability: number; // 0-100
  last_assessed_at: string;
}

export interface BotDetectionSignal {
  id: string;
  ip_address: string;
  user_agent: string;
  request_path: string;
  bot_score: number; // 0-100
  bot_type: 'credential_stuffing' | 'scraper' | 'mass_application_bot' | 'spam_bot' | 'headless_browser';
  action_taken: 'allow' | 'captcha' | 'rate_limit' | 'block';
  request_rate_per_min: number;
  burst_detected: boolean;
  timestamp: string;
}

export interface FraudAlert {
  id: string;
  fraud_type: 'fake_account' | 'suspicious_job' | 'mass_applications' | 'messaging_abuse' | 'payment_fraud';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'flagged' | 'under_review' | 'confirmed_fraud' | 'dismissed';
  entity_type: 'user' | 'company' | 'job_posting' | 'application' | 'message';
  entity_id: string;
  risk_score: number;
  detected_at: string;
  mitigation_action?: string;
}

export interface SecurityDashboardSummary {
  total_events: number;
  failed_logins_24h: number;
  suspicious_activities: number;
  mfa_adoption_rate: number;
  active_incidents: number;
  events_by_type: Record<string, number>;
  active_alerts_count?: number;
  threat_level?: 'normal' | 'elevated' | 'high' | 'critical';
  bot_attacks_blocked_24h?: number;
  fraud_cases_flagged_24h?: number;
  average_account_risk_score?: number;
}

export interface SecurityConfigurationItem {
  id: string;
  key: string;
  category: string;
  label: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  description: string;
  is_sensitive: boolean;
  updated_at: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  assigned_to?: string;
  affected_area: string;
  description: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface PrivacySettings {
  user_id: string;
  profile_visibility: 'Public' | 'Registered' | 'Connections' | 'Recruiters' | 'Private';
  discover_in_search: boolean;
  recruiter_discoverable: boolean;
  recruiter_contactable: boolean;
  show_resume_to_recruiters: boolean;
  messaging_permission: 'Anyone' | 'Connections' | 'Recruiters' | 'None';
  community_visibility: 'Public' | 'Connections' | 'Private';
  search_personalization: boolean;
  ai_data_usage: boolean;
  analytics_consent: boolean;
  marketing_consent: boolean;
  updated_at: string;
}

export interface DataExportStatus {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size_bytes?: number;
  expires_at?: string;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  document: string;
  version: string;
  accepted_at: string;
  source: string;
  ip_address?: string;
  status: 'active' | 'revoked' | 'superseded';
}
