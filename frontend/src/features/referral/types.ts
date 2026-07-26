export type ReferralStatus = 
  | 'pending_accept'
  | 'accepted'
  | 'submitted_to_ats'
  | 'interviewing'
  | 'hired'
  | 'rejected';

export interface ReferralRequest {
  id: string;
  candidate_id: string;
  candidate_name: string;
  company_name: string;
  job_title: string;
  target_job_url?: string;
  resume_link?: string;
  message_to_referrer: string;
  status: 'open' | 'matched' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ReferralHistory {
  id: string;
  referral_id: string;
  actor_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  created_at: string;
}

export interface Referral {
  id: string;
  request_id: string;
  candidate_id: string;
  candidate_name: string;
  referrer_id: string;
  referrer_name: string;
  referrer_company: string;
  referrer_job_title: string;
  referrer_email: string;
  status: ReferralStatus;
  privacy_masked: boolean;
  created_at: string;
  updated_at: string;
  history?: ReferralHistory[];
}

export interface CreateReferralRequestPayload {
  company_name: string;
  job_title: string;
  target_job_url?: string;
  resume_link?: string;
  message_to_referrer: string;
}

export interface OfferReferralPayload {
  request_id: string;
  referrer_name?: string;
  referrer_company: string;
  referrer_job_title: string;
  referrer_email: string;
}

export interface UpdateReferralStatusPayload {
  status: ReferralStatus;
  notes?: string;
}
