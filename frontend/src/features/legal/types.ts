export interface LegalDocument {
  id: string;
  slug: string;
  document_type: string;
  title: string;
  locale: string;
  current_version: string;
  status: string;
  effective_date: string;
  published_date?: string;
  content?: string;
}

export interface LegalDocumentVersion {
  id: string;
  document_id: string;
  version: string;
  title: string;
  content: string;
  change_summary?: string;
  effective_date: string;
}

export interface CookieItem {
  id: string;
  cookie_name: string;
  provider: string;
  category: string;
  purpose: string;
  is_required: boolean;
  is_active: boolean;
}

export interface CookiePreferences {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  third_party: boolean;
}

export interface PrivacyPreferences {
  user_id: string;
  profile_visibility: 'Public' | 'Registered' | 'Connections' | 'Recruiters' | 'Private';
  discover_in_search: boolean;
  recruiter_discoverable: boolean;
  recruiter_contactable: boolean;
  show_resume_to_recruiters: boolean;
  messaging_permission: 'Anyone' | 'Connections' | 'Recruiters' | 'None';
  community_visibility: string;
  search_personalization: boolean;
  ai_data_usage: boolean;
  analytics_consent: boolean;
  marketing_consent: boolean;
  updated_at: string;
}

export interface PrivacyRequest {
  id: string;
  request_type: string;
  status: string;
  due_date: string;
  created_at: string;
}

export interface DataExportJob {
  id: string;
  status: string;
  download_url?: string;
  expires_at: string;
}

export interface ConsentHistoryItem {
  id: string;
  document: string;
  version: string;
  accepted_at: string;
  source: string;
}

export interface DataProcessingRecord {
  id: string;
  activity_name: string;
  purpose: string;
  data_category: string;
  subject_category: string;
  storage_location: string;
  retention_period: string;
  third_parties?: string;
  legal_basis: string;
  updated_at: string;
}

export interface RetentionPolicy {
  id: string;
  data_category: string;
  retention_days: number;
  action_type: 'delete' | 'anonymize' | 'archive';
  description?: string;
  is_active: boolean;
  updated_at: string;
}

export interface ThirdPartyService {
  id: string;
  provider_name: string;
  service_name: string;
  purpose: string;
  data_category: string;
  country_region: string;
  privacy_policy_url?: string;
  terms_url?: string;
  is_enabled: boolean;
}

export interface PrivacyDashboardSummary {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  active_export_jobs: number;
  account_deletion_jobs: number;
  active_legal_holds: number;
  third_party_sub_processors: number;
  consent_count_by_doc: Record<string, number>;
}
