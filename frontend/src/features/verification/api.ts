import axios from 'axios';
import {
  CreateVerificationPayload,
  UpdatePrivacyPayload,
  VerificationRequest,
  VerificationStatus,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

export const verificationApi = {
  createRequest: async (payload: CreateVerificationPayload): Promise<{ message: string; request: VerificationRequest }> => {
    const response = await client.post('/verifications/requests', payload);
    return response.data;
  },

  getUserRequests: async (): Promise<{ data: VerificationRequest[]; count: number }> => {
    const response = await client.get('/verifications/requests');
    return response.data;
  },

  getStatus: async (): Promise<VerificationStatus> => {
    const response = await client.get('/verifications/status');
    return response.data;
  },

  updatePrivacy: async (payload: UpdatePrivacyPayload): Promise<{ message: string; status: VerificationStatus }> => {
    const response = await client.put('/verifications/privacy', payload);
    return response.data;
  },
};

export default verificationApi;
