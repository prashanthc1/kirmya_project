export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: 'analytics' | 'marketing' | 'third_party_sharing';
  is_granted: boolean;
  granted_at: string;
  ip_address: string;
}

export interface DataRequest {
  id: string;
  user_id: string;
  request_type: 'data_export' | 'account_deletion';
  status: 'pending' | 'processing' | 'completed';
  download_url?: string;
  requested_at: string;
  completed_at?: string;
}

export interface AuditEvent {
  id: string;
  user_id: string;
  event_type: string;
  resource: string;
  details: Record<string, any>;
  created_at: string;
}

export interface UpdateConsentPayload {
  consent_type: 'analytics' | 'marketing' | 'third_party_sharing';
  is_granted: boolean;
}
