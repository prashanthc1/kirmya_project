export type VerificationType = 'email' | 'employment' | 'skill' | 'certification';
export type VerificationStatusType = 'pending' | 'in_review' | 'verified' | 'rejected';
export type PrivacySetting = 'public' | 'recruiters_only' | 'private';

export interface VerificationDocument {
  id: string;
  request_id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  is_sensitive: boolean;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  verification_type: VerificationType;
  title: string;
  organization_name?: string;
  credential_id?: string;
  verification_url?: string;
  work_email?: string;
  status: VerificationStatusType;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
  documents?: VerificationDocument[];
}

export interface VerificationStatus {
  id: string;
  user_id: string;
  trust_score: number; // 0 to 100
  badge_level: 'Unverified' | 'Basic' | 'Verified Professional' | 'Verified Elite';
  email_verified: boolean;
  employment_verified: boolean;
  skills_verified: boolean;
  certifications_verified: boolean;
  privacy_setting: PrivacySetting;
  hide_sensitive_docs: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVerificationPayload {
  verification_type: VerificationType;
  title: string;
  organization_name?: string;
  credential_id?: string;
  verification_url?: string;
  work_email?: string;
}

export interface UpdatePrivacyPayload {
  privacy_setting: PrivacySetting;
  hide_sensitive_docs: boolean;
}
