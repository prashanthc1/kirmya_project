export interface SkillEndorsement {
  id: string;
  user_id: string;
  endorser_id: string;
  skill_name: string;
  endorser_name: string;
  endorser_title: string;
  endorser_avatar_url?: string;
  created_at: string;
}

export interface SkillEndorsementGroup {
  skill_name: string;
  endorsement_count: number;
  endorsers: SkillEndorsement[];
}

export interface ProfessionalRecommendation {
  id: string;
  recipient_id: string;
  author_id: string;
  author_name: string;
  author_title: string;
  author_avatar_url?: string;
  relationship: string;
  content_text: string;
  status: 'pending_approval' | 'accepted' | 'hidden' | 'flagged';
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalReference {
  id: string;
  candidate_id: string;
  referee_name: string;
  referee_title: string;
  company_name: string;
  referee_email: string;
  referee_phone?: string;
  relationship: string;
  status: string;
  created_at: string;
}

export interface EndorseSkillPayload {
  user_id: string;
  skill_name: string;
  endorser_name?: string;
  endorser_title?: string;
  endorser_avatar_url?: string;
}

export interface SubmitRecommendationPayload {
  recipient_id: string;
  author_name?: string;
  author_title?: string;
  author_avatar_url?: string;
  relationship: string;
  content_text: string;
}

export interface UpdateRecommendationStatusPayload {
  status: 'accepted' | 'hidden' | 'flagged';
  is_flagged?: boolean;
}

export interface CreateReferencePayload {
  referee_name: string;
  referee_title: string;
  company_name: string;
  referee_email: string;
  referee_phone?: string;
  relationship: string;
}
