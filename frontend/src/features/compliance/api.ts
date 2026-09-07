// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  ConsentRecord,
  DataRequest,
  UpdateConsentPayload,
} from './types';



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
