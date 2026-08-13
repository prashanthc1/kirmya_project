export interface SafetyReport {
  id: string;
  target_type: string;
  target_id: string;
  target_title?: string;
  category: string;
  description: string;
  evidence_urls?: string[];
  status: string;
  priority: string;
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocked_type: string;
  blocked_id: string;
  reason?: string;
  created_at: string;
}

export interface SafetyCase {
  id: string;
  case_number: string;
  target_type: string;
  target_id: string;
  target_title?: string;
  category: string;
  priority: string;
  risk_score: number;
  status: string;
  assigned_team?: string;
  ai_summary?: string;
  ai_recommendation?: string;
  created_at: string;
}

export interface SafetyAppeal {
  id: string;
  decision_id: string;
  reason: string;
  explanation: string;
  status: string;
  submitted_at: string;
}

// Legacy DTO Exports for Backward Compatibility
export interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  target_name: string;
  category: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_id: string;
  target_type: string;
  action: string;
  notes?: string;
  created_at: string;
}

export interface VerificationBadge {
  id: string;
  entity_id: string;
  entity_type: string;
  badge_type: string;
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
  target_type: string;
  target_id: string;
  category: string;
  reason: string;
}

export interface ModerationActionPayload {
  action: string;
  notes?: string;
}
