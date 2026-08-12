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
