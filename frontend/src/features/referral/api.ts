import { authApiClient } from '../../services/api';
import {
  CreateReferralRequestPayload,
  OfferReferralPayload,
  Referral,
  ReferralRequest,
  UpdateReferralStatusPayload,
} from './types';

export const referralApi = {
  createRequest: async (payload: CreateReferralRequestPayload): Promise<{ message: string; request: ReferralRequest }> => {
    const response = await authApiClient.post('/referrals/requests', payload);
    return response.data;
  },

  getOpenRequests: async (): Promise<{ data: ReferralRequest[]; count: number }> => {
    const response = await authApiClient.get('/referrals/requests');
    return response.data;
  },

  offerReferral: async (payload: OfferReferralPayload): Promise<{ message: string; referral: Referral }> => {
    const response = await authApiClient.post('/referrals/offer', payload);
    return response.data;
  },

  getUserReferrals: async (): Promise<{ data: Referral[]; count: number }> => {
    const response = await authApiClient.get('/referrals/my-referrals');
    return response.data;
  },

  updateReferralStatus: async (id: string, payload: UpdateReferralStatusPayload): Promise<{ message: string; referral: Referral }> => {
    const response = await authApiClient.put(`/referrals/${id}/status`, payload);
    return response.data;
  },
};

export default referralApi;
