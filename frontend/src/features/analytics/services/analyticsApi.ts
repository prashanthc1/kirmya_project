// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../../services/authService';
import {
  AdminAnalyticsOverview,
  AnalyticsExportJob,
  CohortGridAnalytics,
  CompanyOverviewAnalytics,
  CustomReportRequest,
  FeatureAdoptionMetrics,
  IngestEventRequest,
  LearningAnalytics,
  MentorshipAnalytics,
  RecruiterHiringAnalytics,
  SystemPerformanceAnalytics,
  TrustSafetyAnalytics,
  UserActivationFunnel,
  UserConsentPreferences,
  UserPersonalAnalytics,
} from '../types';



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

  getAdminUserGrowth: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/users');
    return res.data;
    
  },

  getAdminJobMarket: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/jobs');
    return res.data;
    
  },

  getAdminApplicationFunnel: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/applications');
    return res.data;
    
  },

  getAdminCommunities: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/communities');
    return res.data;
    
  },

  getAdminMessaging: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/messaging');
    return res.data;
    
  },

  getAdminNotifications: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/notifications');
    return res.data;
    
  },

  getAdminRecommendations: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/recommendations');
    return res.data;
    
  },

  getAdminSearch: async (): Promise<any> => {
    const res = await client.get('/admin/analytics/search');
    return res.data;
    
  },

  getPerformanceAnalytics: async (): Promise<SystemPerformanceAnalytics> => {
    const res = await client.get('/admin/analytics/performance');
    return res.data;
    
  },

  getTrustSafetyAnalytics: async (): Promise<TrustSafetyAnalytics> => {
    const res = await client.get('/admin/analytics/trust-safety');
    return res.data;
    
  },

  getMentorshipAnalytics: async (): Promise<MentorshipAnalytics> => {
    const res = await client.get('/analytics/mentorship');
    return res.data;
    
  },

  getLearningAnalytics: async (): Promise<LearningAnalytics> => {
    const res = await client.get('/analytics/learning');
    return res.data;
    
  },

  getActivationFunnel: async (): Promise<UserActivationFunnel> => {
    const res = await client.get('/admin/analytics/funnel');
    return res.data;
    
  },

  getCohortGrid: async (): Promise<CohortGridAnalytics> => {
    const res = await client.get('/admin/analytics/cohorts');
    return res.data;
    
  },

  getFeatureAdoption: async (): Promise<FeatureAdoptionMetrics[]> => {
    const res = await client.get('/admin/analytics/feature-adoption');
    return res.data;
    
  },

  getUserConsent: async (): Promise<UserConsentPreferences> => {
    const res = await client.get('/analytics/user-consent');
    return res.data;
    
  },

  updateUserConsent: async (payload: Partial<UserConsentPreferences>): Promise<UserConsentPreferences> => {
    const res = await client.put('/analytics/user-consent', payload);
    return res.data;
    
  },

  createCustomReport: async (payload: CustomReportRequest): Promise<any> => {
    const res = await client.post('/admin/analytics/reports/custom', payload);
    return res.data;
    
  },

  triggerRetentionCleanup: async (retentionDays: number = 90): Promise<{ message: string; deleted_records: number }> => {
    const res = await client.post('/admin/analytics/retention/cleanup', { retention_days: retentionDays });
    return res.data;
    
  },

  getScheduledReports: async (): Promise<any[]> => {
    const res = await client.get('/admin/analytics/reports/scheduled');
    return res.data;
    
  },

  createScheduledReport: async (payload: any): Promise<any> => {
    const res = await client.post('/admin/analytics/reports/scheduled', payload);
    return res.data;
    
  },

  requestExport: async (format: string = 'csv'): Promise<{ message: string; export: AnalyticsExportJob }> => {
    const res = await client.post('/admin/analytics/export', { format });
    return res.data;
    
  },
};

export default analyticsApi;



