export interface SafetyReport {
  id: string;
  reporter_id?: string;
  target_type: string;
  target_id: string;
  target_title?: string;
  category: string;
  description: string;
  evidence_urls?: string[];
  status: string;
  priority: string;
  reporter_privacy?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserBlock {
  id: string;
  blocker_id?: string;
  blocked_type: string;
  blocked_id: string;
  blocked_name?: string;
  reason?: string;
  created_at: string;
}

export interface UserMute {
  id: string;
  muter_id?: string;
  muted_id: string;
  muted_name?: string;
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
  assigned_to?: string;
  assigned_team?: string;
  reporter_privacy?: boolean;
  ai_summary?: string;
  ai_recommendation?: string;
  created_at: string;
  updated_at?: string;
}

export interface ModerationDecision {
  id: string;
  case_id?: string;
  target_id: string;
  target_type: string;
  action: string;
  reason?: string;
  moderator_id: string;
  notes?: string;
  duration_days?: number;
  created_at: string;
}

export interface UserRestriction {
  id: string;
  user_id: string;
  user_name?: string;
  restriction_type: string;
  reason: string;
  status: 'active' | 'expired' | 'lifted';
  expires_at?: string;
  created_at: string;
  lifted_at?: string;
  lifted_by?: string;
}

export interface SafetyAppeal {
  id: string;
  decision_id: string;
  user_id?: string;
  user_name?: string;
  reason: string;
  explanation: string;
  evidence_urls?: string[];
  status: string;
  reviewer_id?: string;
  reviewer_notes?: string;
  submitted_at: string;
  resolved_at?: string;
}

export interface SafetyRule {
  id: string;
  name: string;
  category: string;
  trigger_event: string;
  conditions: string;
  action: string;
  is_active: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at?: string;
}

export interface SafetyMetricsSummary {
  total_reports: number;
  open_cases: number;
  resolved_today: number;
  avg_resolution_time_hrs: number;
  active_restrictions: number;
  pending_appeals: number;
  high_risk_count: number;
}

export interface ReportSubmitPayload {
  target_type: string;
  target_id: string;
  target_title?: string;
  category: string;
  description: string;
  evidence_urls?: string[];
  reporter_privacy?: boolean;
}

export interface ModerationActionPayload {
  case_id?: string;
  target_id?: string;
  target_type?: string;
  action: string;
  reason?: string;
  notes?: string;
  duration_days?: number;
}

export interface AppealSubmitPayload {
  decision_id: string;
  reason: string;
  explanation: string;
  evidence_urls?: string[];
}

export interface ClaimCasePayload {
  case_id: string;
}

export interface AssignCasePayload {
  case_id: string;
  assignee_id: string;
  team?: string;
}

export interface ResolveAppealPayload {
  appeal_id: string;
  status: 'approved' | 'rejected';
  resolution_notes?: string;
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
