import axios from 'axios';
import {
  FraudLog,
  ModerationAction,
  ModerationActionPayload,
  Report,
  SubmitReportPayload,
  VerificationBadge,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

export const trustApi = {
  getReports: async (status?: string): Promise<{ data: Report[]; count: number }> => {
    const response = await client.get('/trust/reports', {
      params: { status },
    });
    return response.data;
  },

  submitReport: async (payload: SubmitReportPayload): Promise<{ message: string; report: Report }> => {
    const response = await client.post('/trust/reports', payload);
    return response.data;
  },

  executeModerationAction: async (reportID: string, payload: ModerationActionPayload): Promise<{ message: string; action: ModerationAction }> => {
    const response = await client.post(`/trust/reports/${reportID}/action`, payload);
    return response.data;
  },

  blockUser: async (blockedID: string, reason?: string): Promise<{ message: string }> => {
    const response = await client.post('/trust/users/block', {
      blocked_id: blockedID,
      reason,
    });
    return response.data;
  },

  getFraudLogs: async (): Promise<{ data: FraudLog[]; count: number }> => {
    const response = await client.get('/trust/fraud-logs');
    return response.data;
  },

  getBadges: async (): Promise<{ data: VerificationBadge[]; count: number }> => {
    const response = await client.get('/trust/verification');
    return response.data;
  },
};

export default trustApi;
