// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  AddEvidencePayload,
  Contract,
  ContractDetail,
  ContractMilestone,
  CreateMilestonePayload,
  CreateProjectPayload,
  Dispute,
  DisputeDetail,
  DisputeEvidence,
  FundingResult,
  OpenDisputePayload,
  ResolveDisputePayload,
  FreelancerOnboardingStatus,
  FreelancerProfile,
  Project,
  Proposal,
  SaveFreelancerProfilePayload,
  SubmitMilestonePayload,
  SubmitProposalPayload,
} from './types';



export const freelanceApi = {
  getProjects: async (status?: string): Promise<{ data: Project[]; count: number }> => {
    const response = await client.get('/freelance/projects', {
      params: { status },
    });
    return response.data;
  },

  getProjectByID: async (id: string): Promise<Project> => {
    const response = await client.get(`/freelance/projects/${id}`);
    return response.data;
  },

  createProject: async (payload: CreateProjectPayload): Promise<{ message: string; project: Project }> => {
    const response = await client.post('/freelance/projects', payload);
    return response.data;
  },

  submitProposal: async (projectID: string, payload: SubmitProposalPayload): Promise<{ message: string; proposal: Proposal }> => {
    const response = await client.post(`/freelance/projects/${projectID}/proposals`, payload);
    return response.data;
  },

  acceptProposal: async (proposalID: string): Promise<{ message: string; contract: Contract }> => {
    const response = await client.post(`/freelance/proposals/${proposalID}/accept`);
    return response.data;
  },

  getContracts: async (): Promise<{ data: Contract[]; count: number }> => {
    const response = await client.get('/freelance/contracts');
    return response.data;
  },

  getProfile: async (): Promise<FreelancerProfile> => {
    const response = await client.get('/freelance/profile');
    return response.data;
  },

  /**
   * Where this account stands on becoming a freelancer.
   *
   * A read, and only a read: asking does not create a profile, which is what
   * lets the page offer "Become a freelancer" without the act of rendering it
   * having made anybody one.
   */
  getOnboardingStatus: async (): Promise<FreelancerOnboardingStatus> => {
    const response = await client.get('/freelance/onboarding');
    return response.data;
  },

  /**
   * Save the freelancer profile draft.
   *
   * Creates the profile on first call, and grants nothing: the row it creates
   * is 'pending' until completeOnboarding moves it.
   */
  saveProfile: async (
    payload: SaveFreelancerProfilePayload
  ): Promise<{ message: string; profile: FreelancerProfile }> => {
    const response = await client.post('/freelance/profile', payload);
    return response.data;
  },

  /** The one transition that activates the capability. */
  completeOnboarding: async (): Promise<{ message: string; profile: FreelancerProfile }> => {
    const response = await client.post('/freelance/onboarding/complete');
    return response.data;
  },

  /* ----- Escrow. Which party may call each is decided by the server. ----- */

  /** One contract with its milestones and escrow totals. Either party. */
  getContract: async (contractID: string): Promise<ContractDetail> => {
    const response = await client.get(`/freelance/contracts/${contractID}`);
    return response.data;
  },

  /** Client: schedule part of the contract's value. */
  addMilestone: async (contractID: string, payload: CreateMilestonePayload): Promise<ContractMilestone> => {
    const response = await client.post(`/freelance/contracts/${contractID}/milestones`, payload);
    return response.data;
  },

  /** Client: cancel a milestone that has not been paid for. */
  cancelMilestone: async (contractID: string, milestoneID: string): Promise<ContractMilestone> => {
    const response = await client.post(`/freelance/contracts/${contractID}/milestones/${milestoneID}/cancel`);
    return response.data;
  },

  /**
   * Client: request payment for a milestone. Answers 202 with a payment intent;
   * the milestone is funded only when the processor confirms the money.
   */
  fundMilestone: async (contractID: string, milestoneID: string): Promise<FundingResult> => {
    const response = await client.post(`/freelance/contracts/${contractID}/milestones/${milestoneID}/fund`);
    return response.data;
  },

  /** Freelancer: deliver the work for a funded milestone. */
  submitMilestone: async (
    contractID: string,
    milestoneID: string,
    payload: SubmitMilestonePayload
  ): Promise<ContractMilestone> => {
    const response = await client.post(`/freelance/contracts/${contractID}/milestones/${milestoneID}/submit`, payload);
    return response.data;
  },

  /** Client: send submitted work back, with a reason. */
  requestRevision: async (contractID: string, milestoneID: string, reason: string): Promise<ContractMilestone> => {
    const response = await client.post(
      `/freelance/contracts/${contractID}/milestones/${milestoneID}/request-revision`,
      { reason }
    );
    return response.data;
  },

  /** Client: accept submitted work, releasing the escrowed money. */
  approveMilestone: async (contractID: string, milestoneID: string): Promise<ContractMilestone> => {
    const response = await client.post(`/freelance/contracts/${contractID}/milestones/${milestoneID}/approve`);
    return response.data;
  },

  /** Freelancer: give a funded milestone's money back to the client. */
  refundMilestone: async (contractID: string, milestoneID: string, reason: string): Promise<ContractMilestone> => {
    const response = await client.post(`/freelance/contracts/${contractID}/milestones/${milestoneID}/refund`, {
      reason,
    });
    return response.data;
  },

  /* ----- Disputes. ----- */

  /** Either party: dispute a milestone whose money is in escrow. */
  openDispute: async (contractID: string, milestoneID: string, payload: OpenDisputePayload): Promise<Dispute> => {
    const response = await client.post(`/freelance/contracts/${contractID}/milestones/${milestoneID}/dispute`, payload);
    return response.data;
  },

  listContractDisputes: async (contractID: string): Promise<{ data: Dispute[]; count: number }> => {
    const response = await client.get(`/freelance/contracts/${contractID}/disputes`);
    return response.data;
  },

  getDispute: async (disputeID: string): Promise<DisputeDetail> => {
    const response = await client.get(`/freelance/disputes/${disputeID}`);
    return response.data;
  },

  addEvidence: async (disputeID: string, payload: AddEvidencePayload): Promise<DisputeEvidence> => {
    const response = await client.post(`/freelance/disputes/${disputeID}/evidence`, payload);
    return response.data;
  },

  /** The raiser only. */
  withdrawDispute: async (disputeID: string): Promise<Dispute> => {
    const response = await client.post(`/freelance/disputes/${disputeID}/withdraw`);
    return response.data;
  },
};

/**
 * The administrative dispute surface. Every call is refused by the server
 * without an administrator session holding freelance.admin.read (reads) or
 * freelance.admin.write (decisions).
 */
export const freelanceAdminApi = {
  listDisputes: async (
    status = 'open',
    page = 1,
    limit = 20
  ): Promise<{ page: number; limit: number; total_items: number; total_pages: number; data: Dispute[] }> => {
    const response = await client.get('/admin/freelance/disputes', { params: { status, page, limit } });
    return response.data;
  },

  getDispute: async (disputeID: string): Promise<DisputeDetail> => {
    const response = await client.get(`/admin/freelance/disputes/${disputeID}`);
    return response.data;
  },

  resolveDispute: async (disputeID: string, payload: ResolveDisputePayload): Promise<Dispute> => {
    const response = await client.post(`/admin/freelance/disputes/${disputeID}/resolve`, payload);
    return response.data;
  },
};

export default freelanceApi;
