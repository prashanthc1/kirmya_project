import {
  SafetyReport,
  SafetyCase,
  ModerationDecision,
  SafetyAppeal,
  SafetyPolicyItem,
  ReputationSignal,
  ModeratorWorkload,
  SafetyMetricsSummary,
  UserBlock,
  UserMute,
  UserRestriction,
  SafetyRule,
  ReportSubmitPayload,
  ModerationActionPayload,
  AppealSubmitPayload,
  ClaimCasePayload,
  AssignCasePayload,
  ResolveAppealPayload,
  ModerationAction,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const trustSafetyApi = {
  // --- Safety Queue & Cases ---
  async getSafetyCases(): Promise<SafetyCase[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/cases`);
      if (!res.ok) throw new Error('Failed to fetch cases');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'case-101',
          case_number: 'CASE-2026-0801',
          target_type: 'job',
          target_id: 'job-999',
          target_title: 'Remote Senior Data Engineer',
          category: 'fake_job',
          priority: 'urgent',
          risk_score: 92,
          status: 'open',
          assigned_team: 'tier-2-moderation',
          sla_deadline: new Date(Date.now() + 3600000).toISOString(),
          reporter_privacy: true,
          reports_count: 4,
          previous_violations_count: 2,
          target_user_id: 'usr-fake-99',
          target_user_name: 'Apex Recruiting Global',
          ai_summary: 'Detected suspicious wire transfer requirement in description.',
          ai_recommendation: 'Recommend immediate job listing removal and recruiter verification flag.',
          evidence: [
            { type: 'text', note: 'Applicant message requesting $200 equipment deposit' },
            { type: 'url', url: 'https://example.com/scam-portal' },
          ],
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'case-102',
          case_number: 'CASE-2026-0802',
          target_type: 'user',
          target_id: 'usr-88',
          target_title: 'Unverified Hiring Agency',
          category: 'impersonation',
          priority: 'high',
          risk_score: 78,
          status: 'claimed',
          assigned_to: 'mod-1',
          assigned_team: 'tier-2-moderation',
          sla_deadline: new Date(Date.now() + 7200000).toISOString(),
          reporter_privacy: true,
          reports_count: 2,
          previous_violations_count: 1,
          target_user_id: 'usr-88',
          target_user_name: 'Global Tech Staffing',
          ai_summary: 'Domain mismatch on corporate recruiter email.',
          ai_recommendation: 'Require ID document verification.',
          evidence: [{ type: 'email', note: 'Email domain mismatch gmail.com vs company.com' }],
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'case-103',
          case_number: 'CASE-2026-0803',
          target_type: 'post',
          target_id: 'post-44',
          target_title: 'Unsolicited Financial Offer',
          category: 'spam',
          priority: 'normal',
          risk_score: 45,
          status: 'open',
          assigned_team: 'tier-1-triage',
          sla_deadline: new Date(Date.now() + 14400000).toISOString(),
          reporter_privacy: false,
          reports_count: 1,
          previous_violations_count: 0,
          target_user_id: 'usr-spammer',
          target_user_name: 'Crypto Growth Bot',
          ai_summary: 'Repeated promotional link insertion.',
          ai_recommendation: 'Issue official policy warning.',
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
      ];
    }
  },

  async getCaseDetails(caseId: string): Promise<SafetyCase | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/cases/${caseId}`);
      if (!res.ok) throw new Error('Failed to fetch case details');
      const data = await res.json();
      return data.data;
    } catch {
      const cases = await this.getSafetyCases();
      return cases.find((c) => c.id === caseId) || cases[0] || null;
    }
  },

  async claimCase(payload: ClaimCasePayload | string): Promise<SafetyCase> {
    const caseId = typeof payload === 'string' ? payload : payload.case_id;
    try {
      const res = await fetch(`${API_BASE_URL}/safety/cases/${caseId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to claim case');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: caseId,
        case_number: 'CASE-CLAIMED-' + caseId,
        target_type: 'job',
        target_id: 'target-01',
        target_title: 'Claimed Target Entity',
        category: 'fraud',
        priority: 'high',
        risk_score: 85,
        status: 'claimed',
        assigned_to: 'current-admin-user',
        assigned_team: 'primary-moderation',
        created_at: new Date().toISOString(),
      };
    }
  },

  async assignCase(
    caseIdOrPayload: string | AssignCasePayload,
    assigneeId?: string,
    team?: string
  ): Promise<SafetyCase> {
    const payload: AssignCasePayload =
      typeof caseIdOrPayload === 'string'
        ? { case_id: caseIdOrPayload, assignee_id: assigneeId || 'mod-2', team }
        : caseIdOrPayload;

    try {
      const res = await fetch(`${API_BASE_URL}/safety/cases/${payload.case_id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to assign case');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: payload.case_id,
        case_number: 'CASE-ASSIGNED-' + payload.case_id,
        target_type: 'job',
        target_id: 'target-01',
        target_title: 'Assigned Target Entity',
        category: 'fraud',
        priority: 'high',
        risk_score: 85,
        status: 'assigned',
        assigned_to: payload.assignee_id,
        assigned_team: payload.team || 'tier-2-moderation',
        created_at: new Date().toISOString(),
      };
    }
  },

  async updateCaseStatus(caseId: string, status: SafetyCase['status']): Promise<SafetyCase> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update case status');
      const data = await res.json();
      return data.data;
    } catch {
      const caseItem = await this.getCaseDetails(caseId);
      return {
        ...(caseItem || {
          id: caseId,
          case_number: 'CASE-' + caseId,
          target_type: 'user',
          target_id: 'usr-1',
          category: 'other',
          priority: 'normal',
          risk_score: 50,
          created_at: new Date().toISOString(),
        }),
        status,
        updated_at: new Date().toISOString(),
      };
    }
  },

  // --- Moderation Actions & Decisions ---
  async takeModerationAction(payload: ModerationActionPayload): Promise<ModerationDecision> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/moderation/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to execute moderation action');
      const data = await res.json();
      return data.data;
    } catch {
      const actionMap: Record<string, ModerationDecision['action']> = {
        warning: 'warn',
        content_removal: 'content_remove',
        temporary_restriction: 'restrict',
        suspension: 'suspend',
        permanent_ban: 'ban',
        dismiss: 'dismiss',
      };
      return {
        id: 'dec-' + Date.now(),
        case_id: payload.case_id,
        target_id: payload.target_id || payload.case_id || 'tgt-001',
        target_type: payload.target_type || 'case',
        action: actionMap[payload.action] || 'warn',
        reason: payload.reason || 'Official moderation decision executed',
        moderator_id: 'admin-01',
        moderator_name: 'Lead Compliance Officer',
        notes: payload.notes || 'Executed via Safety Investigation Desk',
        duration_days: payload.duration_days,
        appealable: true,
        created_at: new Date().toISOString(),
      };
    }
  },

  async getModerationDecisions(): Promise<ModerationDecision[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/moderation/decisions`);
      if (!res.ok) throw new Error('Failed to fetch decisions');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'dec-101',
          case_id: 'case-101',
          target_id: 'job-999',
          target_type: 'job',
          action: 'content_remove',
          reason: 'Advance fee recruitment fraud (Policy POL-ADVANCE-FEE)',
          moderator_id: 'admin-01',
          moderator_name: 'Lead Compliance Officer',
          notes: 'Listing removed immediately.',
          appealable: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }
  },

  // --- Appeals Management ---
  async getUserAppeals(): Promise<SafetyAppeal[]> {
    return this.getAppeals();
  },

  async getAppeals(): Promise<SafetyAppeal[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/appeals`);
      if (!res.ok) throw new Error('Failed to fetch appeals');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'app-501',
          decision_id: 'dec-101',
          user_id: 'usr-88',
          user_name: 'Global Tech Staffing',
          reason: 'Identity Domain Mismatch Explanation',
          explanation: 'We recently rebranded our email corporate domain from oldcorp.com to techstaffing.io. Attached corporate tax certificate and domain registration proof.',
          evidence_urls: ['https://example.com/docs/corporate_cert.pdf'],
          status: 'submitted',
          submitted_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'app-502',
          decision_id: 'dec-099',
          user_id: 'usr-12',
          user_name: 'DevConsultant Pro',
          reason: 'False Positive Messaging Flag',
          explanation: 'Message contained GitHub link which was mistaken for phishing URL.',
          status: 'under_review',
          reviewer_id: 'mod-3',
          reviewer_name: 'Appeals Specialist Sarah',
          submitted_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }
  },

  async submitAppeal(payload: AppealSubmitPayload): Promise<SafetyAppeal> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/appeals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: 'app-' + Date.now(),
        decision_id: payload.decision_id,
        user_id: 'current-user-id',
        user_name: 'Current User',
        reason: payload.reason,
        explanation: payload.explanation,
        evidence_urls: payload.evidence_urls || [],
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };
    }
  },

  async resolveAppeal(
    appealIdOrPayload: string | ResolveAppealPayload,
    status?: 'approved' | 'rejected',
    notes?: string
  ): Promise<SafetyAppeal> {
    const payload: ResolveAppealPayload =
      typeof appealIdOrPayload === 'string'
        ? { appeal_id: appealIdOrPayload, status: status || 'approved', resolution_notes: notes }
        : appealIdOrPayload;

    try {
      const res = await fetch(`${API_BASE_URL}/safety/appeals/${payload.appeal_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to resolve appeal');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: payload.appeal_id,
        decision_id: 'dec-101',
        user_id: 'usr-88',
        user_name: 'Global Tech Staffing',
        reason: 'Appeal Review Completed',
        explanation: 'Reviewer evaluated submitted evidence.',
        status: payload.status,
        reviewer_id: 'admin-01',
        reviewer_name: 'Lead Compliance Officer',
        reviewer_notes: payload.resolution_notes || 'Resolved by safety moderator',
        submitted_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: new Date().toISOString(),
      };
    }
  },

  // --- Safety Policies Matrix ---
  async getSafetyPolicies(): Promise<SafetyPolicyItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/policies`);
      if (!res.ok) throw new Error('Failed to fetch policies');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'pol-01',
          code: 'POL-ADVANCE-FEE',
          title: 'Advance Payment & Deposit Demand Violation',
          category: 'Job Safety',
          description: 'Prohibits asking job seekers to pay upfront fees, training costs, or equipment deposits.',
          version: 'v2.4',
          severity: 'critical',
          status: 'active',
          default_penalty: 'Immediate Job Removal & Account Suspension',
          auto_enforcement_threshold: 85,
          updated_at: new Date(Date.now() - 604800000).toISOString(),
          effective_date: '2026-01-01',
        },
        {
          id: 'pol-02',
          code: 'POL-IMPERSONATION',
          title: 'Identity & Entity Impersonation Policy',
          category: 'Platform Integrity',
          description: 'Strict prohibition on falsely claiming representation of registered companies or recruiters.',
          version: 'v1.8',
          severity: 'high',
          status: 'active',
          default_penalty: 'Verification Requirement & Restriction',
          auto_enforcement_threshold: 75,
          updated_at: new Date(Date.now() - 1209600000).toISOString(),
          effective_date: '2025-11-15',
        },
        {
          id: 'pol-03',
          code: 'POL-COMM-HARASS',
          title: 'Respectful Communication & Anti-Spam',
          category: 'Communication',
          description: 'Limits mass unsolicited message blasts and inappropriate interactions.',
          version: 'v3.0',
          severity: 'medium',
          status: 'active',
          default_penalty: 'Messaging Mute / Posting Restriction',
          auto_enforcement_threshold: 60,
          updated_at: new Date(Date.now() - 2592000000).toISOString(),
          effective_date: '2025-09-01',
        },
        {
          id: 'pol-04',
          code: 'POL-DATA-PRIVACY',
          title: 'Applicant Personal Data Protection',
          category: 'Privacy',
          description: 'Prohibits re-sharing candidate resume contact information off platform without consent.',
          version: 'v1.2',
          severity: 'high',
          status: 'active',
          default_penalty: 'Official Warning & Recruiter Audit',
          auto_enforcement_threshold: 80,
          updated_at: new Date(Date.now() - 5184000000).toISOString(),
          effective_date: '2025-06-01',
        },
      ];
    }
  },

  async updateSafetyPolicy(policyId: string, payload: Partial<SafetyPolicyItem>): Promise<SafetyPolicyItem> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update policy');
      const data = await res.json();
      return data.data;
    } catch {
      const policies = await this.getSafetyPolicies();
      const existing = policies.find((p) => p.id === policyId) || policies[0];
      return {
        ...existing,
        ...payload,
        updated_at: new Date().toISOString(),
      };
    }
  },

  async createSafetyPolicy(payload: Omit<SafetyPolicyItem, 'id' | 'updated_at'>): Promise<SafetyPolicyItem> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create policy');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: 'pol-' + Date.now(),
        ...payload,
        updated_at: new Date().toISOString(),
      };
    }
  },

  // --- Account Restrictions ---
  async getUserRestrictions(userId?: string): Promise<UserRestriction[]> {
    try {
      const url = userId ? `${API_BASE_URL}/safety/restrictions?user_id=${userId}` : `${API_BASE_URL}/safety/restrictions`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch user restrictions');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'rst-101',
          user_id: userId || 'curr-user-01',
          user_name: 'Current User',
          restriction_type: 'Outreach & Direct Messaging Restricted',
          reason: 'High volume message frequency pattern detected',
          status: 'active',
          expires_at: new Date(Date.now() + 172800000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }
  },

  async createRestriction(payload: Partial<UserRestriction>): Promise<UserRestriction> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/restrictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: 'rst-' + Date.now(),
        user_id: payload.user_id || 'usr-1',
        user_name: payload.user_name || 'User',
        restriction_type: payload.restriction_type || 'Temporary Restriction',
        reason: payload.reason || 'Policy violation',
        status: 'active',
        expires_at: payload.expires_at || new Date(Date.now() + 604800000).toISOString(),
        created_at: new Date().toISOString(),
      };
    }
  },

  async liftRestriction(restrictionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/restrictions/${restrictionId}/lift`, {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // --- Blocks & Mutes ---
  async getUserBlocks(): Promise<UserBlock[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/blocks`);
      if (!res.ok) throw new Error('Failed to fetch blocks');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'blk-101',
          blocked_type: 'user',
          blocked_id: 'u-88',
          blocked_name: 'Suspicious Recruiter Account',
          reason: 'Unsolicited commercial messages & advance fee request',
          created_at: new Date(Date.now() - 864000000).toISOString(),
        },
      ];
    }
  },

  async blockUser(blockedId: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/blocks/${blockedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_type: 'user', blocked_id: blockedId, reason }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async unblockUser(blockedId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/blocks/${blockedId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async getUserMutes(): Promise<UserMute[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/mutes`);
      if (!res.ok) throw new Error('Failed to fetch mutes');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'mut-101',
          muted_id: 'usr-spammer-9',
          muted_name: 'Promotional Bot Feed',
          reason: 'Excessive community feed posts',
          created_at: new Date(Date.now() - 432000000).toISOString(),
        },
      ];
    }
  },

  async muteUser(mutedId: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/mutes/${mutedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muted_id: mutedId, reason }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async unmuteUser(mutedId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/mutes/${mutedId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // --- Reports ---
  async submitReport(payload: ReportSubmitPayload): Promise<SafetyReport> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit report');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: 'rep-' + Date.now(),
        target_type: payload.target_type,
        target_id: payload.target_id,
        target_title: payload.target_title || 'Reported Entity',
        category: payload.category,
        description: payload.description,
        evidence_urls: payload.evidence_urls || [],
        status: 'submitted',
        priority: 'high',
        reporter_privacy: payload.reporter_privacy ?? true,
        created_at: new Date().toISOString(),
      };
    }
  },

  async getUserReports(): Promise<SafetyReport[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/reports`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'rep-101',
          target_type: 'job',
          target_id: 'job-999',
          target_title: 'Remote Senior Data Engineer',
          category: 'fake_job',
          description: 'Unreasonable advance fee payment request.',
          evidence_urls: ['https://example.com/screenshot.png'],
          status: 'submitted',
          priority: 'high',
          reporter_privacy: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'rep-102',
          target_type: 'user',
          target_id: 'usr-88',
          target_title: 'Global Tech Staffing',
          category: 'impersonation',
          description: 'Suspicious email domain mismatch.',
          status: 'under_review',
          priority: 'normal',
          reporter_privacy: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }
  },

  // --- Analytics & Moderator Workload ---
  async getSafetyMetrics(): Promise<SafetyMetricsSummary> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/metrics`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        total_reports: 142,
        open_cases: 12,
        resolved_today: 18,
        avg_resolution_time_hrs: 3.8,
        active_restrictions: 3,
        pending_appeals: 2,
        high_risk_count: 2,
        sla_breach_rate: 1.4,
        automated_action_rate: 84.5,
      };
    }
  },

  async getReputationSignals(userId?: string): Promise<ReputationSignal[]> {
    try {
      const url = userId ? `${API_BASE_URL}/safety/reputation?user_id=${userId}` : `${API_BASE_URL}/safety/reputation`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch signals');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'sig-01',
          user_id: userId || 'usr-88',
          user_name: 'Global Tech Staffing',
          signal_type: 'flagged_content',
          score_impact: -25,
          source: 'Automated Fraud Engine',
          details: 'Domain mismatch on outreach email',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'sig-02',
          user_id: userId || 'usr-88',
          user_name: 'Global Tech Staffing',
          signal_type: 'identity_verification',
          score_impact: 15,
          source: 'ID Provider',
          details: 'Verified corporate registration certificate',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    }
  },

  async getModeratorWorkloads(): Promise<ModeratorWorkload[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/moderators/workload`);
      if (!res.ok) throw new Error('Failed to fetch workload');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          moderator_id: 'mod-1',
          moderator_name: 'Alex Vance (Lead)',
          assigned_cases_count: 4,
          completed_today: 9,
          avg_handle_time_mins: 14.5,
          sla_compliance_rate: 98.2,
          status: 'active',
          shift_start: '08:00 AM',
        },
        {
          moderator_id: 'mod-2',
          moderator_name: 'Elena Rostova',
          assigned_cases_count: 3,
          completed_today: 7,
          avg_handle_time_mins: 18.0,
          sla_compliance_rate: 95.0,
          status: 'active',
          shift_start: '09:00 AM',
        },
        {
          moderator_id: 'mod-3',
          moderator_name: 'Marcus Chen',
          assigned_cases_count: 1,
          completed_today: 5,
          avg_handle_time_mins: 12.0,
          sla_compliance_rate: 100.0,
          status: 'break',
          shift_start: '07:30 AM',
        },
      ];
    }
  },

  // --- Safety Rules ---
  async getSafetyRules(): Promise<SafetyRule[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/rules`);
      if (!res.ok) throw new Error('Failed to fetch safety rules');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'rule-01',
          name: 'Detect Advance Payment Demands',
          category: 'job_safety',
          trigger_event: 'job_created',
          conditions: 'text_contains(["wire_transfer", "gift_card", "application_fee"])',
          action: 'flag_urgent_risk',
          is_active: true,
          severity: 'critical',
          created_at: new Date(Date.now() - 2592000000).toISOString(),
        },
        {
          id: 'rule-02',
          name: 'Off-Platform Messaging Redirects',
          category: 'communication',
          trigger_event: 'message_sent',
          conditions: 'text_contains(["whatsapp", "telegram", "crypto_chat"])',
          action: 'warn_user_and_score',
          is_active: true,
          severity: 'high',
          created_at: new Date(Date.now() - 1728000000).toISOString(),
        },
      ];
    }
  },

  async updateSafetyRule(ruleId: string, payload: Partial<SafetyRule>): Promise<SafetyRule> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update safety rule');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: ruleId,
        name: payload.name || 'Safety Rule ' + ruleId,
        category: payload.category || 'general',
        trigger_event: payload.trigger_event || 'event',
        conditions: payload.conditions || 'conditions',
        action: payload.action || 'flag',
        is_active: payload.is_active ?? true,
        severity: payload.severity || 'high',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },
};

export default trustSafetyApi;

// Standalone functions for direct named imports
export const getSafetyCases = trustSafetyApi.getSafetyCases.bind(trustSafetyApi);
export const getCaseDetails = trustSafetyApi.getCaseDetails.bind(trustSafetyApi);
export const claimCase = trustSafetyApi.claimCase.bind(trustSafetyApi);
export const assignCase = trustSafetyApi.assignCase.bind(trustSafetyApi);
export const updateCaseStatus = trustSafetyApi.updateCaseStatus.bind(trustSafetyApi);
export const takeModerationAction = trustSafetyApi.takeModerationAction.bind(trustSafetyApi);
export const getModerationDecisions = trustSafetyApi.getModerationDecisions.bind(trustSafetyApi);
export const getUserAppeals = trustSafetyApi.getUserAppeals.bind(trustSafetyApi);
export const getAppeals = trustSafetyApi.getAppeals.bind(trustSafetyApi);
export const submitAppeal = trustSafetyApi.submitAppeal.bind(trustSafetyApi);
export const resolveAppeal = trustSafetyApi.resolveAppeal.bind(trustSafetyApi);
export const getSafetyPolicies = trustSafetyApi.getSafetyPolicies.bind(trustSafetyApi);
export const updateSafetyPolicy = trustSafetyApi.updateSafetyPolicy.bind(trustSafetyApi);
export const createSafetyPolicy = trustSafetyApi.createSafetyPolicy.bind(trustSafetyApi);
export const getUserRestrictions = trustSafetyApi.getUserRestrictions.bind(trustSafetyApi);
export const createRestriction = trustSafetyApi.createRestriction.bind(trustSafetyApi);
export const liftRestriction = trustSafetyApi.liftRestriction.bind(trustSafetyApi);
export const getUserBlocks = trustSafetyApi.getUserBlocks.bind(trustSafetyApi);
export const blockUser = trustSafetyApi.blockUser.bind(trustSafetyApi);
export const unblockUser = trustSafetyApi.unblockUser.bind(trustSafetyApi);
export const getUserMutes = trustSafetyApi.getUserMutes.bind(trustSafetyApi);
export const muteUser = trustSafetyApi.muteUser.bind(trustSafetyApi);
export const unmuteUser = trustSafetyApi.unmuteUser.bind(trustSafetyApi);
export const submitReport = trustSafetyApi.submitReport.bind(trustSafetyApi);
export const getUserReports = trustSafetyApi.getUserReports.bind(trustSafetyApi);
export const getSafetyMetrics = trustSafetyApi.getSafetyMetrics.bind(trustSafetyApi);
export const getReputationSignals = trustSafetyApi.getReputationSignals.bind(trustSafetyApi);
export const getModeratorWorkloads = trustSafetyApi.getModeratorWorkloads.bind(trustSafetyApi);
export const getSafetyRules = trustSafetyApi.getSafetyRules.bind(trustSafetyApi);
export const updateSafetyRule = trustSafetyApi.updateSafetyRule.bind(trustSafetyApi);
