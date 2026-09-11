// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  Contract,
  CreateProjectPayload,
  FreelancerOnboardingStatus,
  FreelancerProfile,
  Project,
  Proposal,
  SaveFreelancerProfilePayload,
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
};

export default freelanceApi;
