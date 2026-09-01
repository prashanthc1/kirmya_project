import { authApiClient } from '../../services/authService';
import {
  CompanyDirectoryItem,
  CompanyDirectoryResponse,
  CompanyFilterQuery,
  IndustryCategory,
} from './types';

export const companiesApi = {
  getDirectory: async (params?: CompanyFilterQuery): Promise<CompanyDirectoryResponse> => {
    const res = await authApiClient.get<CompanyDirectoryResponse>('/companies', { params });
    return res.data;
  },

  getFeatured: async (): Promise<CompanyDirectoryItem[]> => {
    const res = await authApiClient.get<CompanyDirectoryItem[]>('/companies/featured');
    return res.data;
  },

  getPopular: async (): Promise<CompanyDirectoryItem[]> => {
    const res = await authApiClient.get<CompanyDirectoryItem[]>('/companies/popular');
    return res.data;
  },

  getRecommended: async (): Promise<{ company: any; profile: any }[]> => {
    const res = await authApiClient.get('/companies/recommended');
    return res.data;
  },

  getIndustries: async (): Promise<IndustryCategory[]> => {
    const res = await authApiClient.get<IndustryCategory[]>('/companies/industries');
    return res.data;
  },

  getByHandle: async (handle: string): Promise<{ company: any; profile: any; following: boolean }> => {
    const res = await authApiClient.get(`/companies/handle/${handle}`);
    return res.data;
  },

  followCompany: async (companyId: string): Promise<{ following: boolean }> => {
    const res = await authApiClient.post('/companies/follow', { company_id: companyId });
    return res.data;
  },

  unfollowCompany: async (companyId: string): Promise<{ following: boolean }> => {
    const res = await authApiClient.delete('/companies/follow', { data: { company_id: companyId } });
    return res.data;
  },

  saveCompany: async (companyId: string): Promise<{ saved: boolean }> => {
    const res = await authApiClient.post('/companies/save', { company_id: companyId });
    return res.data;
  },

  unsaveCompany: async (companyId: string): Promise<{ saved: boolean }> => {
    const res = await authApiClient.delete('/companies/save', { data: { company_id: companyId } });
    return res.data;
  },
};

export default companiesApi;
