import axios from 'axios';
import {
  AuditLog,
  CandidatePool,
  CreatePoolPayload,
  CreateTeamPayload,
  Enterprise,
  HiringTeam,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

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
