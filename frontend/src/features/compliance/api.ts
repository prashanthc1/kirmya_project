import axios from 'axios';
import {
  ConsentRecord,
  DataRequest,
  UpdateConsentPayload,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

export const complianceApi = {
  getConsents: async (): Promise<{ data: ConsentRecord[]; count: number }> => {
    const response = await client.get('/compliance/consent');
    return response.data;
  },

  updateConsent: async (payload: UpdateConsentPayload): Promise<{ message: string }> => {
    const response = await client.post('/compliance/consent', payload);
    return response.data;
  },

  requestDataExport: async (): Promise<{ message: string; request: DataRequest }> => {
    const response = await client.post('/compliance/export');
    return response.data;
  },

  requestAccountDeletion: async (): Promise<{ message: string; request: DataRequest }> => {
    const response = await client.post('/compliance/delete-account');
    return response.data;
  },

  getDataRequests: async (): Promise<{ data: DataRequest[]; count: number }> => {
    const response = await client.get('/compliance/requests');
    return response.data;
  },
};

export default complianceApi;
