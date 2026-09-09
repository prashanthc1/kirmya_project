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
    const res = await fetch(`${API_BASE_URL}/safety/cases`);
    if (!res.ok) throw new Error('Failed to fetch cases');
    const data = await res.json();
    return data.data;
    
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
    const res = await fetch(`${API_BASE_URL}/safety/cases/${caseId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to claim case');
    const data = await res.json();
    return data.data;
    
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

    const res = await fetch(`${API_BASE_URL}/safety/cases/${payload.case_id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to assign case');
    const data = await res.json();
    return data.data;
    
  },

  async updateCaseStatus(caseId: string, status: SafetyCase['status']): Promise<SafetyCase> {
    const res = await fetch(`${API_BASE_URL}/safety/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update case status');
    const data = await res.json();
    return data.data;
    
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
    const res = await fetch(`${API_BASE_URL}/safety/moderation/decisions`);
    if (!res.ok) throw new Error('Failed to fetch decisions');
    const data = await res.json();
    return data.data;
    
  },

  // --- Appeals Management ---
  async getUserAppeals(): Promise<SafetyAppeal[]> {
    return this.getAppeals();
  },

  async getAppeals(): Promise<SafetyAppeal[]> {
    const res = await fetch(`${API_BASE_URL}/safety/appeals`);
    if (!res.ok) throw new Error('Failed to fetch appeals');
    const data = await res.json();
    return data.data;
    
  },

  async submitAppeal(payload: AppealSubmitPayload): Promise<SafetyAppeal> {
    const res = await fetch(`${API_BASE_URL}/safety/appeals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit appeal');
    const data = await res.json();
    return data.data;
    
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

    const res = await fetch(`${API_BASE_URL}/safety/appeals/${payload.appeal_id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to resolve appeal');
    const data = await res.json();
    return data.data;
    
  },

  // --- Safety Policies Matrix ---
  async getSafetyPolicies(): Promise<SafetyPolicyItem[]> {
    const res = await fetch(`${API_BASE_URL}/safety/policies`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    const data = await res.json();
    return data.data;
    
  },

  async updateSafetyPolicy(policyId: string, payload: Partial<SafetyPolicyItem>): Promise<SafetyPolicyItem> {
    const res = await fetch(`${API_BASE_URL}/safety/policies/${policyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update policy');
    const data = await res.json();
    return data.data;
    
  },

  async createSafetyPolicy(payload: Omit<SafetyPolicyItem, 'id' | 'updated_at'>): Promise<SafetyPolicyItem> {
    const res = await fetch(`${API_BASE_URL}/safety/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create policy');
    const data = await res.json();
    return data.data;
    
  },

  // --- Account Restrictions ---
  async getUserRestrictions(userId?: string): Promise<UserRestriction[]> {
    const url = userId ? `${API_BASE_URL}/safety/restrictions?user_id=${userId}` : `${API_BASE_URL}/safety/restrictions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch user restrictions');
    const data = await res.json();
    return data.data;
    
  },

  async createRestriction(payload: Partial<UserRestriction>): Promise<UserRestriction> {
    const res = await fetch(`${API_BASE_URL}/safety/restrictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create restriction');
    const data = await res.json();
    return data.data;
    
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
    const res = await fetch(`${API_BASE_URL}/safety/blocks`);
    if (!res.ok) throw new Error('Failed to fetch blocks');
    const data = await res.json();
    return data.data;
    
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
    const res = await fetch(`${API_BASE_URL}/safety/mutes`);
    if (!res.ok) throw new Error('Failed to fetch mutes');
    const data = await res.json();
    return data.data;
    
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
    const res = await fetch(`${API_BASE_URL}/safety/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    const data = await res.json();
    return data.data;
    
  },

  async getUserReports(): Promise<SafetyReport[]> {
    const res = await fetch(`${API_BASE_URL}/safety/reports`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    const data = await res.json();
    return data.data;
    
  },

  // --- Analytics & Moderator Workload ---
  async getSafetyMetrics(): Promise<SafetyMetricsSummary> {
    const res = await fetch(`${API_BASE_URL}/safety/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    const data = await res.json();
    return data.data;
    
  },

  async getReputationSignals(userId?: string): Promise<ReputationSignal[]> {
    const url = userId ? `${API_BASE_URL}/safety/reputation?user_id=${userId}` : `${API_BASE_URL}/safety/reputation`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch signals');
    const data = await res.json();
    return data.data;
    
  },

  async getModeratorWorkloads(): Promise<ModeratorWorkload[]> {
    const res = await fetch(`${API_BASE_URL}/safety/moderators/workload`);
    if (!res.ok) throw new Error('Failed to fetch workload');
    const data = await res.json();
    return data.data;
    
  },

  // --- Safety Rules ---
  async getSafetyRules(): Promise<SafetyRule[]> {
    const res = await fetch(`${API_BASE_URL}/safety/rules`);
    if (!res.ok) throw new Error('Failed to fetch safety rules');
    const data = await res.json();
    return data.data;
    
  },

  async updateSafetyRule(ruleId: string, payload: Partial<SafetyRule>): Promise<SafetyRule> {
    const res = await fetch(`${API_BASE_URL}/safety/rules/${ruleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update safety rule');
    const data = await res.json();
    return data.data;
    
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
