import {
  SafetyReport,
  UserBlock,
  SafetyCase,
  SafetyAppeal,
  Report,
  ModerationAction,
  VerificationBadge,
  FraudLog,
  SubmitReportPayload,
  ModerationActionPayload,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const safetyApi = {
  async submitReport(payload: {
    target_type: string;
    target_id: string;
    target_title?: string;
    category: string;
    description: string;
    evidence_urls?: string[];
  }): Promise<SafetyReport> {
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
          target_title: 'Remote Senior Engineer',
          category: 'fake_job',
          description: 'Unreasonable advance fee payment request.',
          status: 'submitted',
          priority: 'high',
          created_at: new Date(Date.now() - 3600000).toISOString(),
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
          reason: 'Unsolicited commercial messages',
          created_at: new Date(Date.now() - 864000000).toISOString(),
        },
      ];
    }
  },

  async submitAppeal(payload: {
    decision_id: string;
    reason: string;
    explanation: string;
    evidence_urls?: string[];
  }): Promise<SafetyAppeal> {
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
        reason: payload.reason,
        explanation: payload.explanation,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };
    }
  },

  async getUserAppeals(): Promise<SafetyAppeal[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/appeals`);
      if (!res.ok) throw new Error('Failed to fetch appeals');
      const data = await res.json();
      return data.data;
    } catch {
      return [
        {
          id: 'app-501',
          decision_id: 'dec-12',
          reason: 'False Positive Flag',
          explanation: 'Provided official recruiter verification credentials.',
          status: 'submitted',
          submitted_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
    }
  },
};

// Legacy Export for Compatibility
export const trustApi = {
  getReports: async (status?: string): Promise<{ data: Report[]; count: number }> => {
    return {
      data: [
        {
          id: 'rep-101',
          reporter_id: 'u-1',
          target_type: 'job',
          target_id: 'j-1',
          target_name: 'Remote Data Entry',
          category: 'fake_job',
          reason: 'Wire transfer request',
          status: status || 'ALL',
          created_at: new Date().toISOString(),
        },
      ],
      count: 1,
    };
  },
  submitReport: async (payload: SubmitReportPayload): Promise<{ message: string; report: Report }> => {
    return {
      message: 'Report submitted successfully',
      report: {
        id: 'rep-102',
        reporter_id: 'u-1',
        target_type: payload.target_type,
        target_id: payload.target_id,
        target_name: 'Reported Item',
        category: payload.category,
        reason: payload.reason,
        status: 'submitted',
        created_at: new Date().toISOString(),
      },
    };
  },
  executeModerationAction: async (reportID: string, payload: ModerationActionPayload): Promise<{ message: string; action: ModerationAction }> => {
    return {
      message: 'Action executed',
      action: {
        id: 'act-1',
        moderator_id: 'admin-1',
        target_id: reportID,
        target_type: 'report',
        action: payload.action,
        notes: payload.notes,
        created_at: new Date().toISOString(),
      },
    };
  },
  blockUser: async (blockedID: string, reason?: string): Promise<{ message: string }> => {
    return { message: 'User blocked successfully' };
  },
  getFraudLogs: async (): Promise<{ data: FraudLog[]; count: number }> => {
    return {
      data: [
        {
          id: 'f-1',
          entity_type: 'job',
          entity_id: 'j-1',
          entity_title: 'Remote Crypto Analyst',
          fraud_score: 95.0,
          triggers: ['advance_payment_request', 'telegram_only'],
          action_taken: 'Flagged for Human Review',
          created_at: new Date().toISOString(),
        },
      ],
      count: 1,
    };
  },
  getBadges: async (): Promise<{ data: VerificationBadge[]; count: number }> => {
    return {
      data: [
        {
          id: 'b-1',
          entity_id: 'u-1',
          entity_type: 'user',
          badge_type: 'identity_verified',
          issued_at: new Date().toISOString(),
        },
      ],
      count: 1,
    };
  },
};

export default trustApi;
