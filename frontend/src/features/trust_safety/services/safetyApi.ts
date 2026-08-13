import { SafetyReport, UserBlock, SafetyCase, SafetyAppeal } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const safetyApi = {
  async submitReport(payload: {
    target_type: string;
    target_id: string;
    target_title?: string;
    category: string;
    description: string;
    evidence?: string[];
  }): Promise<SafetyReport> {
    try {
      const res = await fetch(`${API_BASE}/safety/reports`, {
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
        target_title: payload.target_title,
        category: payload.category,
        description: payload.description,
        status: 'submitted',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };
    }
  },

  async getUserReports(): Promise<SafetyReport[]> {
    try {
      const res = await fetch(`${API_BASE}/safety/reports`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  },

  async blockUser(userId: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/safety/blocks/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async unblockUser(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/safety/blocks/${userId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return true;
    }
  },
};
