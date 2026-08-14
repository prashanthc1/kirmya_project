'use client';

/**
 * React Query bindings for the company module.
 *
 * Query keys are namespaced by company so that two companies open in two tabs
 * never share a cache entry — the same mistake that would let one organization
 * see another's numbers. Mutations invalidate the narrowest key that could have
 * changed rather than the whole namespace.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';

import { companyManagementApi } from './api';
import {
  AssociationRequestPayload,
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
  CompanyPeoplePage,
  CompanyMembership,
  CompanyReviewsPage,
  CompanySearchQuery,
  CompanyUpdatePayload,
  CompanyUpdatesPage,
  CompanyDataExport,
  EmployerSettings,
  EmployerSettingsUpdatePayload,
  JobAnalytics,
  PeopleQuery,
  ReviewPayload,
  RoleDescriptor,
  TeamInvitePayload,
  TeamMemberUpdatePayload,
  TransferOwnershipPayload,
  UpdatePayload,
  VerificationSubmitPayload,
} from './types';

export const companyKeys = {
  all: ['company'] as const,
  detail: (identifier: string) => ['company', 'detail', identifier] as const,
  search: (query: CompanySearchQuery) => ['company', 'search', query] as const,
  discovery: () => ['company', 'discovery'] as const,
  following: () => ['company', 'following'] as const,
  memberships: () => ['company', 'memberships'] as const,
  permissions: () => ['company', 'permission-catalog'] as const,
  settings: (companyId: string) => ['company', companyId, 'settings'] as const,
  people: (identifier: string, query: PeopleQuery) =>
    ['company', identifier, 'people', query] as const,
  departments: (identifier: string) => ['company', identifier, 'departments'] as const,
  team: (companyId: string, query: PeopleQuery) => ['company', companyId, 'team', query] as const,
  recruiters: (companyId: string, query: PeopleQuery) =>
    ['company', companyId, 'recruiters', query] as const,
  invitations: (companyId: string, status?: string) =>
    ['company', companyId, 'invitations', status ?? 'all'] as const,
  invitationToken: (token: string) => ['company', 'invitation-token', token] as const,
  verification: (companyId: string) => ['company', companyId, 'verification'] as const,
  jobs: (identifier: string, query: Record<string, unknown>) =>
    ['company', identifier, 'jobs', query] as const,
  jobAnalytics: (companyId: string, jobId: string) =>
    ['company', companyId, 'jobs', jobId, 'analytics'] as const,
  dashboard: (companyId: string) => ['company', companyId, 'dashboard'] as const,
  analytics: (companyId: string, range: Record<string, unknown>) =>
    ['company', companyId, 'analytics', range] as const,
  insights: (companyId: string, range: Record<string, unknown>) =>
    ['company', companyId, 'insights', range] as const,
  audit: (companyId: string, query: Record<string, unknown>) =>
    ['company', companyId, 'audit', query] as const,
  reviews: (identifier: string, query: Record<string, unknown>) =>
    ['company', identifier, 'reviews', query] as const,
  updates: (identifier: string, query: Record<string, unknown>) =>
    ['company', identifier, 'updates', query] as const,
};

/** Everything cached under one company, used after a write that reshapes it. */
const companyScope = (identifier: string) => ['company', identifier];

type QueryOpts<T> = Omit<UseQueryOptions<T, Error, T, readonly unknown[]>, 'queryKey' | 'queryFn'>;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const useCompany = (identifier: string, options?: QueryOpts<CompanyDetail>) =>
  useQuery({
    queryKey: companyKeys.detail(identifier),
    queryFn: () => companyManagementApi.getCompany(identifier),
    enabled: !!identifier,
    ...options,
  });

export const useCompanySearch = (query: CompanySearchQuery, options?: QueryOpts<CompanyListPage>) =>
  useQuery({
    queryKey: companyKeys.search(query),
    queryFn: () => companyManagementApi.searchCompanies(query),
    ...options,
  });

export const useCompanyDiscovery = (options?: QueryOpts<CompanyDiscovery>) =>
  useQuery({
    queryKey: companyKeys.discovery(),
    queryFn: () => companyManagementApi.getDiscovery(),
    ...options,
  });

export const useFollowedCompanies = (options?: QueryOpts<CompanyListPage>) =>
  useQuery({
    queryKey: companyKeys.following(),
    queryFn: () => companyManagementApi.listFollowing(),
    ...options,
  });

/**
 * The companies the signed-in user may manage. Every dashboard screen depends
 * on this, so it is cached for the session and refreshed after a company is
 * created or a membership changes.
 */
export const useMyCompanies = (options?: QueryOpts<CompanyMembership[]>) =>
  useQuery({
    queryKey: companyKeys.memberships(),
    queryFn: () => companyManagementApi.listMyCompanies(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });

export const usePermissionCatalog = (options?: QueryOpts<RoleDescriptor[]>) =>
  useQuery({
    queryKey: companyKeys.permissions(),
    queryFn: () => companyManagementApi.getPermissionCatalog(),
    // The role vocabulary changes with a deploy, not with a request.
    staleTime: 60 * 60 * 1000,
    ...options,
  });

export const useCreateCompany = (
  options?: UseMutationOptions<CompanyDetail, Error, CompanyCreatePayload>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompanyCreatePayload) => companyManagementApi.createCompany(payload),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.discovery() });
      // The creator becomes its owner, so the switcher has a new entry.
      queryClient.invalidateQueries({ queryKey: companyKeys.memberships() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useUpdateCompany = (
  companyId: string,
  options?: UseMutationOptions<CompanyDetail, Error, CompanyUpdatePayload>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompanyUpdatePayload) =>
      companyManagementApi.updateCompany(companyId, payload),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      // The slug is a second identity for the same row, so refresh by both.
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(companyId) });
      if (data?.slug) {
        queryClient.invalidateQueries({ queryKey: companyKeys.detail(data.slug) });
      }
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

// ---------------------------------------------------------------------------
// Follow
// ---------------------------------------------------------------------------

export const useFollowCompany = (identifier: string, companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (following: boolean) =>
      following
        ? companyManagementApi.unfollow(companyId)
        : companyManagementApi.follow(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(identifier) });
      queryClient.invalidateQueries({ queryKey: companyKeys.following() });
    },
  });
};

// ---------------------------------------------------------------------------
// People, team and recruiters
// ---------------------------------------------------------------------------

export const usePeople = (
  identifier: string,
  query: PeopleQuery = {},
  options?: QueryOpts<CompanyPeoplePage>
) =>
  useQuery({
    queryKey: companyKeys.people(identifier, query),
    queryFn: () => companyManagementApi.getPeople(identifier, query),
    enabled: !!identifier,
    ...options,
  });

export const useDepartments = (identifier: string, options?: QueryOpts<CompanyDepartment[]>) =>
  useQuery({
    queryKey: companyKeys.departments(identifier),
    queryFn: () => companyManagementApi.getDepartments(identifier),
    enabled: !!identifier,
    ...options,
  });

export const useTeam = (
  companyId: string,
  query: PeopleQuery = {},
  options?: QueryOpts<CompanyPeoplePage>
) =>
  useQuery({
    queryKey: companyKeys.team(companyId, query),
    queryFn: () => companyManagementApi.getTeam(companyId, query),
    enabled: !!companyId,
    ...options,
  });

export const useRecruiters = (
  companyId: string,
  query: PeopleQuery = {},
  options?: QueryOpts<CompanyPeoplePage>
) =>
  useQuery({
    queryKey: companyKeys.recruiters(companyId, query),
    queryFn: () => companyManagementApi.getRecruiters(companyId, query),
    enabled: !!companyId,
    ...options,
  });

export const useRequestAssociation = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssociationRequestPayload) =>
      companyManagementApi.requestAssociation(companyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useDecideAssociation = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, decision }: { memberId: string; decision: 'approve' | 'reject' }) =>
      companyManagementApi.decideAssociation(companyId, memberId, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useInviteTeamMember = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeamInvitePayload) =>
      companyManagementApi.inviteTeamMember(companyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useInviteRecruiter = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeamInvitePayload) =>
      companyManagementApi.inviteRecruiter(companyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useUpdateTeamMember = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: TeamMemberUpdatePayload }) =>
      companyManagementApi.updateTeamMember(companyId, memberId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useRemoveTeamMember = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => companyManagementApi.removeTeamMember(companyId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useSetMemberPermissions = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, permissions }: { memberId: string; permissions: string[] }) =>
      companyManagementApi.setMemberPermissions(companyId, memberId, permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useSetRecruiterSuspended = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recruiterId, suspended }: { recruiterId: string; suspended: boolean }) =>
      companyManagementApi.setRecruiterSuspended(companyId, recruiterId, suspended),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

export const useRemoveRecruiter = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recruiterId: string) =>
      companyManagementApi.removeRecruiter(companyId, recruiterId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export const useInvitations = (
  companyId: string,
  status?: string,
  options?: QueryOpts<CompanyInvitation[]>
) =>
  useQuery({
    queryKey: companyKeys.invitations(companyId, status),
    queryFn: () => companyManagementApi.listInvitations(companyId, status),
    enabled: !!companyId,
    ...options,
  });

export const useRevokeInvitation = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      companyManagementApi.revokeInvitation(companyId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(companyId) }),
  });
};

/**
 * Reads an invitation from the token in the link.
 *
 * The token is the credential, so it is never cached beyond the page that holds
 * it and never retried: a token that has expired or been revoked should say so
 * once rather than be attempted again.
 */
export const useInvitationPreview = (
  token: string,
  options?: QueryOpts<{ invitation: CompanyInvitation; company: CompanyDetail }>
) =>
  useQuery({
    queryKey: companyKeys.invitationToken(token),
    queryFn: () => companyManagementApi.previewInvitation(token),
    enabled: !!token,
    retry: false,
    gcTime: 0,
    ...options,
  });

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => companyManagementApi.acceptInvitation(token),
    onSuccess: () => {
      // Accepting creates the membership the whole dashboard is keyed on.
      queryClient.invalidateQueries({ queryKey: companyKeys.memberships() });
    },
  });
};

export const useDeclineInvitation = () =>
  useMutation({
    mutationFn: (token: string) => companyManagementApi.declineInvitation(token),
  });

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export const useVerification = (companyId: string) =>
  useQuery({
    queryKey: companyKeys.verification(companyId),
    queryFn: () => companyManagementApi.getVerification(companyId),
    enabled: !!companyId,
  });

export const useSubmitVerification = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerificationSubmitPayload) =>
      companyManagementApi.submitVerification(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.verification(companyId) });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(companyId) });
    },
  });
};

// ---------------------------------------------------------------------------
// Jobs, dashboard, analytics and insights
// ---------------------------------------------------------------------------

export const useCompanyJobs = (
  identifier: string,
  query: { status?: string; page?: number; limit?: number } = {},
  options?: QueryOpts<CompanyJobsPage>
) =>
  useQuery({
    queryKey: companyKeys.jobs(identifier, query),
    queryFn: () => companyManagementApi.getJobs(identifier, query),
    enabled: !!identifier,
    ...options,
  });

export const useCompanyDashboard = (companyId: string, options?: QueryOpts<CompanyDashboard>) =>
  useQuery({
    queryKey: companyKeys.dashboard(companyId),
    queryFn: () => companyManagementApi.getDashboard(companyId),
    enabled: !!companyId,
    ...options,
  });

export const useCompanyAnalytics = (
  companyId: string,
  range: { from?: string; to?: string } = {},
  options?: QueryOpts<CompanyAnalytics>
) =>
  useQuery({
    queryKey: companyKeys.analytics(companyId, range),
    queryFn: () => companyManagementApi.getAnalytics(companyId, range),
    enabled: !!companyId,
    ...options,
  });

export const useJobAnalytics = (
  companyId: string,
  jobId: string,
  options?: QueryOpts<JobAnalytics>
) =>
  useQuery({
    queryKey: companyKeys.jobAnalytics(companyId, jobId),
    queryFn: () => companyManagementApi.getJobAnalytics(companyId, jobId),
    enabled: !!companyId && !!jobId,
    ...options,
  });

export const useCompanyInsights = (
  companyId: string,
  range: { from?: string; to?: string } = {},
  options?: QueryOpts<CompanyInsightsReport>
) =>
  useQuery({
    queryKey: companyKeys.insights(companyId, range),
    queryFn: () => companyManagementApi.getInsights(companyId, range),
    enabled: !!companyId,
    ...options,
  });

export const useAuditLog = (companyId: string, query: { page?: number; limit?: number } = {}) =>
  useQuery({
    queryKey: companyKeys.audit(companyId, query),
    queryFn: () => companyManagementApi.getAuditLog(companyId, query),
    enabled: !!companyId,
  });

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const useCompanyReviews = (
  identifier: string,
  query: { page?: number; limit?: number; sort?: string } = {},
  options?: QueryOpts<CompanyReviewsPage>
) =>
  useQuery({
    queryKey: companyKeys.reviews(identifier, query),
    queryFn: () => companyManagementApi.getReviews(identifier, query),
    enabled: !!identifier,
    ...options,
  });

export const useSubmitReview = (companyId: string, identifier: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId?: string; payload: ReviewPayload }) =>
      reviewId
        ? companyManagementApi.updateReview(companyId, reviewId, payload)
        : companyManagementApi.createReview(companyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(identifier) }),
  });
};

export const useDeleteReview = (companyId: string, identifier: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => companyManagementApi.deleteReview(companyId, reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(identifier) }),
  });
};

export const useReportReview = (companyId: string) =>
  useMutation({
    mutationFn: ({
      reviewId,
      reason,
      details,
    }: {
      reviewId: string;
      reason: string;
      details?: string;
    }) => companyManagementApi.reportReview(companyId, reviewId, { reason, details }),
  });

export const useRespondToReview = (companyId: string, identifier: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      companyManagementApi.respondToReview(companyId, reviewId, response),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(identifier) }),
  });
};

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

export const useCompanyUpdates = (
  identifier: string,
  query: { status?: string; page?: number; limit?: number } = {},
  options?: QueryOpts<CompanyUpdatesPage>
) =>
  useQuery({
    queryKey: companyKeys.updates(identifier, query),
    queryFn: () => companyManagementApi.getUpdates(identifier, query),
    enabled: !!identifier,
    ...options,
  });

export const useSaveUpdate = (companyId: string, identifier: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ updateId, payload }: { updateId?: string; payload: UpdatePayload }) =>
      updateId
        ? companyManagementApi.editUpdate(companyId, updateId, payload)
        : companyManagementApi.createUpdate(companyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(identifier) }),
  });
};

export const useDeleteUpdate = (companyId: string, identifier: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updateId: string) => companyManagementApi.deleteUpdate(companyId, updateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyScope(identifier) }),
  });
};

// ---------------------------------------------------------------------------
// Employer Settings & Actions
// ---------------------------------------------------------------------------

export const useEmployerSettings = (
  companyId: string,
  options?: QueryOpts<EmployerSettings>
) =>
  useQuery({
    queryKey: companyKeys.settings(companyId),
    queryFn: () => companyManagementApi.getEmployerSettings(companyId),
    enabled: !!companyId,
    ...options,
  });

export const useUpdateEmployerSettings = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployerSettingsUpdatePayload) =>
      companyManagementApi.updateEmployerSettings(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.settings(companyId) });
    },
  });
};

export const useTransferOwnership = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferOwnershipPayload) =>
      companyManagementApi.transferOwnership(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyScope(companyId) });
    },
  });
};

export const useResendInvitation = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      companyManagementApi.resendInvitation(companyId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.invitations(companyId) });
    },
  });
};

export const useExportCompanyData = (companyId: string) => {
  return useMutation({
    mutationFn: () => companyManagementApi.exportCompanyData(companyId),
  });
};

