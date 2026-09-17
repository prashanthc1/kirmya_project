import { authApiClient } from '../../services/api';
import {
  CreateVerificationPayload,
  UpdatePrivacyPayload,
  VerificationRequest,
  VerificationStatus,
} from './types';

export const verificationApi = {
  createRequest: async (payload: CreateVerificationPayload): Promise<{ message: string; request: VerificationRequest }> => {
    const response = await authApiClient.post('/verifications/requests', payload);
    return response.data;
  },

  getUserRequests: async (): Promise<{ data: VerificationRequest[]; count: number }> => {
    const response = await authApiClient.get('/verifications/requests');
    return response.data;
  },

  getStatus: async (): Promise<VerificationStatus> => {
    const response = await authApiClient.get('/verifications/status');
    return response.data;
  },

  updatePrivacy: async (payload: UpdatePrivacyPayload): Promise<{ message: string; status: VerificationStatus }> => {
    const response = await authApiClient.put('/verifications/privacy', payload);
    return response.data;
  },
};

export default verificationApi;
