export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'user' | 'company' | 'job';
  target_id: string;
  target_name: string;
  category: 'spam' | 'fraud' | 'harassment' | 'fake_job';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_id: string;
  target_type: string;
  action: 'warn' | 'block' | 'suspend' | 'remove';
  notes: string;
  created_at: string;
}

export interface VerificationBadge {
  id: string;
  entity_id: string;
  entity_type: string;
  badge_type: 'identity_verified' | 'employment_verified' | 'company_verified';
  issued_at: string;
}

export interface FraudLog {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  fraud_score: number;
  triggers: string[];
  action_taken: string;
  created_at: string;
}

export interface SubmitReportPayload {
  target_type: 'user' | 'company' | 'job';
  target_id: string;
  category: 'spam' | 'fraud' | 'harassment' | 'fake_job';
  reason: string;
}

export interface ModerationActionPayload {
  action: 'warn' | 'block' | 'suspend' | 'remove';
  notes: string;
}
