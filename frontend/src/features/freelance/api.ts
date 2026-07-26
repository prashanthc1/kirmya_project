import axios from 'axios';
import {
  Contract,
  CreateProjectPayload,
  FreelancerProfile,
  Project,
  Proposal,
  SubmitProposalPayload,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

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
