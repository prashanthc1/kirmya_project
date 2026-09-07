// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  AuditLog,
  CandidatePool,
  CreatePoolPayload,
  CreateTeamPayload,
  Enterprise,
  HiringTeam,
} from './types';



export const enterpriseApi = {
  getOverview: async (): Promise<Enterprise> => {
    const response = await client.get('/enterprise/overview');
    return response.data;
  },

  getTeams: async (): Promise<{ data: HiringTeam[]; count: number }> => {
    const response = await client.get('/enterprise/teams');
    return response.data;
  },

  createTeam: async (payload: CreateTeamPayload): Promise<{ message: string; team: HiringTeam }> => {
    const response = await client.post('/enterprise/teams', payload);
    return response.data;
  },

  getCandidatePools: async (): Promise<{ data: CandidatePool[]; count: number }> => {
    const response = await client.get('/enterprise/pools');
    return response.data;
  },

  createCandidatePool: async (payload: CreatePoolPayload): Promise<{ message: string; pool: CandidatePool }> => {
    const response = await client.post('/enterprise/pools', payload);
    return response.data;
  },

  getAuditLogs: async (): Promise<{ data: AuditLog[]; count: number }> => {
    const response = await client.get('/enterprise/audit-logs');
    return response.data;
  },
};

export default enterpriseApi;
