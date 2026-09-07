// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  CreateReferralRequestPayload,
  OfferReferralPayload,
  Referral,
  ReferralRequest,
  UpdateReferralStatusPayload,
} from './types';

const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';


client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

export const referralApi = {
  createRequest: async (payload: CreateReferralRequestPayload): Promise<{ message: string; request: ReferralRequest }> => {
    const response = await client.post('/referrals/requests', payload);
    return response.data;
  },

  getOpenRequests: async (): Promise<{ data: ReferralRequest[]; count: number }> => {
    const response = await client.get('/referrals/requests');
    return response.data;
  },

  offerReferral: async (payload: OfferReferralPayload): Promise<{ message: string; referral: Referral }> => {
    const response = await client.post('/referrals/offer', payload);
    return response.data;
  },

  getUserReferrals: async (): Promise<{ data: Referral[]; count: number }> => {
    const response = await client.get('/referrals/my-referrals');
    return response.data;
  },

  updateReferralStatus: async (id: string, payload: UpdateReferralStatusPayload): Promise<{ message: string; referral: Referral }> => {
    const response = await client.put(`/referrals/${id}/status`, payload);
    return response.data;
  },
};

export default referralApi;
