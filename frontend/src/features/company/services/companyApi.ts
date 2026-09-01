import { authApiClient } from '../../../services/authService';
import { companyManagementApi } from '../api';

export * from '../api';
export { companyManagementApi };

export const companyApi = {
  ...companyManagementApi,

  registerCompany: async (payload: {
    name: string;
    handle: string;
    industry: string;
    location: string;
    website: string;
    companySize: string;
    foundedYear: number;
  }) => {
    const response = await authApiClient.post('/companies', payload);
    return response.data;
  },

  searchCompanies: async (query: string = '') => {
    const response = await authApiClient.get(`/companies?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  getRecommendations: async (limit: number = 3) => {
    const response = await authApiClient.get(`/companies/recommended?limit=${limit}`);
    return response.data;
  },

  getByHandle: async (handle: string) => {
    const response = await authApiClient.get(`/companies/handle/${encodeURIComponent(handle)}`);
    return response.data;
  },

  updateProfile: async (
    companyID: string,
    payload: {
      about: string;
      logoUrl?: string;
      coverUrl?: string;
      website: string;
      location: string;
      companySize: string;
      culture: string;
      benefits: string[];
      employeeInsights: string;
    }
  ) => {
    const response = await authApiClient.put(`/companies/${companyID}`, payload);
    return response.data;
  },

  followCompany: async (companyID: string) => {
    const response = await authApiClient.post(`/companies/${companyID}/follow`);
    return response.data;
  },

  unfollowCompany: async (companyID: string) => {
    const response = await authApiClient.delete(`/companies/${companyID}/follow`);
    return response.data;
  },

  saveCompany: async (companyID: string) => {
    const response = await authApiClient.post('/companies/save', { company_id: companyID });
    return response.data;
  },

  unsaveCompany: async (companyID: string) => {
    const response = await authApiClient.delete('/companies/save', { data: { company_id: companyID } });
    return response.data;
  },

  requestVerification: async (companyID: string, documents: string[]) => {
    const response = await authApiClient.post(`/companies/${companyID}/verify`, { documents });
    return response.data;
  },
};

export default companyApi;
