import { apiClient } from '@/services/api';

const client = apiClient;

export const companyApi = {
  registerCompany: async (payload: {
    name: string;
    handle: string;
    industry: string;
    location: string;
    website: string;
    companySize: string;
    foundedYear: number;
  }) => {
    const response = await client.post('/companies', payload);
    return response.data;
  },

  searchCompanies: async (query: string = '') => {
    const response = await client.get(`/companies?query=${query}`);
    return response.data;
  },

  getRecommendations: async (limit: number = 3) => {
    const response = await client.get(`/companies/recommendations?limit=${limit}`);
    return response.data;
  },

  getByHandle: async (handle: string) => {
    const response = await client.get(`/companies/handle/${handle}`);
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
    const response = await client.put(`/companies/${companyID}`, payload);
    return response.data;
  },

  followCompany: async (companyID: string) => {
    const response = await client.post(`/companies/${companyID}/follow`);
    return response.data;
  },

  requestVerification: async (companyID: string, documents: string[]) => {
    const response = await client.post(`/companies/${companyID}/verify`, { documents });
    return response.data;
  },
};
export default companyApi;
