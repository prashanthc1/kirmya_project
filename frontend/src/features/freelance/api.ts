// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  Contract,
  CreateProjectPayload,
  FreelancerProfile,
  Project,
  Proposal,
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
};

export default freelanceApi;
