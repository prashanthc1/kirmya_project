import axios from 'axios';
import {
  AdminAnalyticsOverview,
  AnalyticsExportJob,
  CompanyOverviewAnalytics,
  IngestEventRequest,
  RecruiterHiringAnalytics,
  UserPersonalAnalytics,
} from '../types';

const API_BASE = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

export const analyticsApi = {
  ingestEvent: async (payload: IngestEventRequest): Promise<{ message: string; event: any }> => {
    const res = await client.post('/internal/analytics/events', payload);
    return res.data;
  },

  getUserAnalytics: async (): Promise<UserPersonalAnalytics> => {
    const res = await client.get('/analytics/profile');
    return res.data;
  },

  getRecruiterAnalytics: async (orgID?: string): Promise<RecruiterHiringAnalytics> => {
    const res = await client.get('/recruiter/analytics/overview', {
      params: { organization_id: orgID },
    });
    return res.data;
  },

  getCompanyAnalytics: async (companyID?: string): Promise<CompanyOverviewAnalytics> => {
    const res = await client.get('/company/analytics/overview', {
      params: { company_id: companyID },
    });
    return res.data;
  },

  getAdminOverview: async (): Promise<AdminAnalyticsOverview> => {
    const res = await client.get('/admin/analytics/overview');
    return res.data;
  },

  requestExport: async (format: string = 'csv'): Promise<{ message: string; export: AnalyticsExportJob }> => {
    const res = await client.post('/admin/analytics/export', { format });
    return res.data;
  },
};

export default analyticsApi;
