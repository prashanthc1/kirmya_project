export interface SecurityOverview {
  user_id: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  active_sessions_count: number;
  trusted_devices_count: number;
  recent_security_events: number;
  password_last_changed_at: string;
  security_score: number;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

export interface MFASetupResponse {
  secret: string;
  qr_code_uri: string;
  recovery_codes: string[];
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
}

export interface LoginHistoryItem {
  id: string;
  event_type: string;
  severity: string;
  ip_address: string;
  user_agent: string;
  location: string;
  created_at: string;
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

export interface SecurityDashboardSummary {
  total_events: number;
  failed_logins_24h: number;
  suspicious_activities: number;
  mfa_adoption_rate: number;
  active_incidents: number;
  events_by_type: Record<string, number>;
}
