/**
 * HTTP client for the company and organization management API.
 *
 * Every call goes through `authApiClient` from the auth feature, which attaches
 * the in-memory access token and transparently refreshes it on 401. Nothing
 * here stores credentials or decides authorization: the server is the only
 * authority on what a caller may do, and these functions simply surface its
 * answer.
 */
import { authApiClient } from '../../services/authService';
import {
  AssociationRequestPayload,
  AuditEntry,
  CompanyAnalytics,
  CompanyCreatePayload,
  CompanyDashboard,
  CompanyDepartment,
  CompanyDetail,
  CompanyDiscovery,
  CompanyInsightsReport,
  CompanyInvitation,
  CompanyJobsPage,
  CompanyListPage,
  CompanyMembership,
  CompanyPeoplePage,
  CompanyPerson,
  CompanyReviewsPage,
  CompanySearchQuery,
  CompanyUpdate,
  CompanyUpdatePayload,
  CompanyUpdatesPage,
  CompanyVerification,
  FollowPayload,
  InvitationIssued,
  JobAnalytics,
  PeopleQuery,
  ReviewPayload,
  ReviewReportPayload,
  RoleDescriptor,
  TeamInvitePayload,
  TeamMemberUpdatePayload,
  UpdatePayload,
  VerificationStatus,
  VerificationSubmitPayload,
} from './types';

/**
 * Drops undefined and empty values so an untouched filter never narrows a
 * query. Arrays are passed through for axios to serialise as repeated keys,
 * matching Gin's `form:"skills"` binding.
 */
const clean = (params: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out;
};

export const companyManagementApi = {
  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------

  /** `identifier` may be a company id or a slug; the server resolves both. */
  getCompany: async (identifier: string): Promise<CompanyDetail> => {
    const res = await authApiClient.get<CompanyDetail>(`/companies/${identifier}`);
    return res.data;
  },

  createCompany: async (payload: CompanyCreatePayload): Promise<CompanyDetail> => {
    const res = await authApiClient.post<CompanyDetail>('/companies', payload);
    return res.data;
  },

  updateCompany: async (
    companyId: string,
    payload: CompanyUpdatePayload
  ): Promise<CompanyDetail> => {
    const res = await authApiClient.put<CompanyDetail>(`/companies/${companyId}`, payload);
    return res.data;
  },

  searchCompanies: async (query: CompanySearchQuery): Promise<CompanyListPage> => {
    const res = await authApiClient.get<CompanyListPage>('/companies/search', {
      params: clean(query as Record<string, unknown>),
    });
    return res.data;
  },

  getDiscovery: async (): Promise<CompanyDiscovery> => {
    const res = await authApiClient.get<CompanyDiscovery>('/companies/discovery');
    return res.data;
  },

  getPermissionCatalog: async (): Promise<RoleDescriptor[]> => {
    const res = await authApiClient.get<RoleDescriptor[]>('/companies/permissions');
    return res.data;
  },

  // -------------------------------------------------------------------------
  // Follow
  // -------------------------------------------------------------------------

  follow: async (companyId: string, payload: FollowPayload = {}): Promise<void> => {
    await authApiClient.post(`/companies/${companyId}/follow`, payload);
  },

  unfollow: async (companyId: string): Promise<void> => {
    await authApiClient.delete(`/companies/${companyId}/follow`);
  },

  listFollowing: async (): Promise<CompanyListPage> => {
    const res = await authApiClient.get<CompanyListPage>('/companies/following');
    return res.data;
  },

  // The companies the signed-in user may manage, with the permissions that come
  // with each. The dashboard cannot pick a company without this.
  listMyCompanies: async (): Promise<CompanyMembership[]> => {
    const res = await authApiClient.get<CompanyMembership[]>('/companies/mine');
    return res.data ?? [];
  },

  // -------------------------------------------------------------------------
  // People and team
  // -------------------------------------------------------------------------

  getPeople: async (identifier: string, query: PeopleQuery = {}): Promise<CompanyPeoplePage> => {
    const res = await authApiClient.get<CompanyPeoplePage>(`/companies/${identifier}/people`, {
      params: clean(query as Record<string, unknown>),
    });
    return res.data;
  },

  requestAssociation: async (
    companyId: string,
    payload: AssociationRequestPayload
  ): Promise<CompanyPerson> => {
    const res = await authApiClient.post<CompanyPerson>(`/companies/${companyId}/people`, payload);
    return res.data;
  },

  decideAssociation: async (
    companyId: string,
    memberId: string,
    decision: 'approve' | 'reject'
  ): Promise<void> => {
    await authApiClient.put(`/companies/${companyId}/people/${memberId}`, { decision });
  },

  getTeam: async (companyId: string, query: PeopleQuery = {}): Promise<CompanyPeoplePage> => {
    const res = await authApiClient.get<CompanyPeoplePage>(`/companies/${companyId}/team`, {
      params: clean(query as Record<string, unknown>),
    });
    return res.data;
  },

  inviteTeamMember: async (
    companyId: string,
    payload: TeamInvitePayload
  ): Promise<InvitationIssued> => {
    const res = await authApiClient.post<InvitationIssued>(
      `/companies/${companyId}/team/invite`,
      payload
    );
    return res.data;
  },

  updateTeamMember: async (
    companyId: string,
    memberId: string,
    payload: TeamMemberUpdatePayload
  ): Promise<void> => {
    await authApiClient.put(`/companies/${companyId}/team/${memberId}`, payload);
  },

  removeTeamMember: async (companyId: string, memberId: string): Promise<void> => {
    await authApiClient.delete(`/companies/${companyId}/team/${memberId}`);
  },

  setMemberPermissions: async (
    companyId: string,
    memberId: string,
    permissions: string[]
  ): Promise<void> => {
    await authApiClient.put(`/companies/${companyId}/team/${memberId}/permissions`, {
      permissions,
    });
  },

  // -------------------------------------------------------------------------
  // Recruiters
  // -------------------------------------------------------------------------

  getRecruiters: async (companyId: string, query: PeopleQuery = {}): Promise<CompanyPeoplePage> => {
    const res = await authApiClient.get<CompanyPeoplePage>(`/companies/${companyId}/recruiters`, {
      params: clean(query as Record<string, unknown>),
    });
    return res.data;
  },

  inviteRecruiter: async (
    companyId: string,
    payload: TeamInvitePayload
  ): Promise<InvitationIssued> => {
    const res = await authApiClient.post<InvitationIssued>(
      `/companies/${companyId}/recruiters/invite`,
      payload
    );
    return res.data;
  },

  setRecruiterSuspended: async (
    companyId: string,
    recruiterId: string,
    suspended: boolean
  ): Promise<void> => {
    await authApiClient.put(`/companies/${companyId}/recruiters/${recruiterId}`, { suspended });
  },

  removeRecruiter: async (companyId: string, recruiterId: string): Promise<void> => {
    await authApiClient.delete(`/companies/${companyId}/recruiters/${recruiterId}`);
  },

  // -------------------------------------------------------------------------
  // Invitations
  // -------------------------------------------------------------------------

  listInvitations: async (companyId: string, status?: string): Promise<CompanyInvitation[]> => {
    const res = await authApiClient.get<{ items: CompanyInvitation[] }>(
      `/companies/${companyId}/invitations`,
      { params: clean({ status }) }
    );
    return res.data.items ?? [];
  },

  revokeInvitation: async (companyId: string, invitationId: string): Promise<void> => {
    await authApiClient.delete(`/companies/${companyId}/invitations/${invitationId}`);
  },

  previewInvitation: async (
    token: string
  ): Promise<{ invitation: CompanyInvitation; company: CompanyDetail }> => {
    const res = await authApiClient.get(`/companies/invitations/${token}`);
    return res.data;
  },

  acceptInvitation: async (token: string): Promise<string> => {
    const res = await authApiClient.post<{ companyId: string }>(
      `/companies/invitations/${token}/accept`
    );
    return res.data.companyId;
  },

  declineInvitation: async (token: string): Promise<void> => {
    await authApiClient.post(`/companies/invitations/${token}/decline`);
  },

  // -------------------------------------------------------------------------
  // Verification
  // -------------------------------------------------------------------------

  getVerification: async (
    companyId: string
  ): Promise<{ status: VerificationStatus; verification: CompanyVerification | null }> => {
    const res = await authApiClient.get(`/companies/${companyId}/verification`);
    return res.data;
  },

  submitVerification: async (
    companyId: string,
    payload: VerificationSubmitPayload
  ): Promise<CompanyVerification> => {
    const res = await authApiClient.post<CompanyVerification>(
      `/companies/${companyId}/verification`,
      payload
    );
    return res.data;
  },

  // -------------------------------------------------------------------------
  // Jobs, dashboard and analytics
  // -------------------------------------------------------------------------

  getJobs: async (
    identifier: string,
    query: { status?: string; page?: number; limit?: number } = {}
  ): Promise<CompanyJobsPage> => {
    const res = await authApiClient.get<CompanyJobsPage>(`/companies/${identifier}/jobs`, {
      params: clean(query),
    });
    return res.data;
  },

  getDashboard: async (companyId: string): Promise<CompanyDashboard> => {
    const res = await authApiClient.get<CompanyDashboard>(`/companies/${companyId}/dashboard`);
    return res.data;
  },

  getAnalytics: async (
    companyId: string,
    range: { from?: string; to?: string } = {}
  ): Promise<CompanyAnalytics> => {
    const res = await authApiClient.get<CompanyAnalytics>(`/companies/${companyId}/analytics`, {
      params: clean(range),
    });
    return res.data;
  },

  getJobAnalytics: async (companyId: string, jobId: string): Promise<JobAnalytics> => {
    const res = await authApiClient.get<JobAnalytics>(
      `/companies/${companyId}/jobs/${jobId}/analytics`
    );
    return res.data;
  },

  getInsights: async (
    companyId: string,
    range: { from?: string; to?: string } = {}
  ): Promise<CompanyInsightsReport> => {
    const res = await authApiClient.get<CompanyInsightsReport>(
      `/companies/${companyId}/insights`,
      { params: clean(range) }
    );
    return res.data;
  },

  getAuditLog: async (
    companyId: string,
    query: { page?: number; limit?: number } = {}
  ): Promise<{ items: AuditEntry[]; total: number; page: number; limit: number }> => {
    const res = await authApiClient.get(`/companies/${companyId}/audit`, {
      params: clean(query),
    });
    return res.data;
  },

  // -------------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------------

  getReviews: async (
    identifier: string,
    query: { page?: number; limit?: number; sort?: string } = {}
  ): Promise<CompanyReviewsPage> => {
    const res = await authApiClient.get<CompanyReviewsPage>(`/companies/${identifier}/reviews`, {
      params: clean(query),
    });
    return res.data;
  },

  createReview: async (companyId: string, payload: ReviewPayload): Promise<void> => {
    await authApiClient.post(`/companies/${companyId}/reviews`, payload);
  },

  updateReview: async (
    companyId: string,
    reviewId: string,
    payload: ReviewPayload
  ): Promise<void> => {
    await authApiClient.put(`/companies/${companyId}/reviews/${reviewId}`, payload);
  },

  deleteReview: async (companyId: string, reviewId: string): Promise<void> => {
    await authApiClient.delete(`/companies/${companyId}/reviews/${reviewId}`);
  },

  reportReview: async (
    companyId: string,
    reviewId: string,
    payload: ReviewReportPayload
  ): Promise<void> => {
    await authApiClient.post(`/companies/${companyId}/reviews/${reviewId}/report`, payload);
  },

  respondToReview: async (
    companyId: string,
    reviewId: string,
    response: string
  ): Promise<void> => {
    await authApiClient.post(`/companies/${companyId}/reviews/${reviewId}/response`, { response });
  },

  // -------------------------------------------------------------------------
  // Updates
  // -------------------------------------------------------------------------

  getUpdates: async (
    identifier: string,
    query: { status?: string; page?: number; limit?: number } = {}
  ): Promise<CompanyUpdatesPage> => {
    const res = await authApiClient.get<CompanyUpdatesPage>(`/companies/${identifier}/updates`, {
      params: clean(query),
    });
    return res.data;
  },

  createUpdate: async (companyId: string, payload: UpdatePayload): Promise<CompanyUpdate> => {
    const res = await authApiClient.post<CompanyUpdate>(
      `/companies/${companyId}/updates`,
      payload
    );
    return res.data;
  },

  editUpdate: async (
    companyId: string,
    updateId: string,
    payload: UpdatePayload
  ): Promise<CompanyUpdate> => {
    const res = await authApiClient.put<CompanyUpdate>(
      `/companies/${companyId}/updates/${updateId}`,
      payload
    );
    return res.data;
  },

  deleteUpdate: async (companyId: string, updateId: string): Promise<void> => {
    await authApiClient.delete(`/companies/${companyId}/updates/${updateId}`);
  },

  // -------------------------------------------------------------------------
  // Departments (used by the people filter and the team editor)
  // -------------------------------------------------------------------------

  // `/company/...`, not `/companies/...`: the plural path is bound to the older
  // directory handler, which returns a different shape.
  getDepartments: async (identifier: string): Promise<CompanyDepartment[]> => {
    const res = await authApiClient.get<CompanyDepartment[]>(
      `/company/${identifier}/departments`
    );
    return res.data;
  },
};

export default companyManagementApi;
