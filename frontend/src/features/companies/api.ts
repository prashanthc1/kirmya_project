import axios from 'axios';
import {
  CompanyDirectoryItem,
  CompanyDirectoryResponse,
  CompanyFilterQuery,
  IndustryCategory,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const companiesApi = {
  getDirectory: async (params?: CompanyFilterQuery): Promise<CompanyDirectoryResponse> => {
    const res = await apiClient.get<CompanyDirectoryResponse>('/companies', { params });
    return res.data;
  },

  getFeatured: async (): Promise<CompanyDirectoryItem[]> => {
    const res = await apiClient.get<CompanyDirectoryItem[]>('/companies/featured');
    return res.data;
  },

  getPopular: async (): Promise<CompanyDirectoryItem[]> => {
    const res = await apiClient.get<CompanyDirectoryItem[]>('/companies/popular');
    return res.data;
  },

  getRecommended: async (): Promise<{ company: any; profile: any }[]> => {
    const res = await apiClient.get('/companies/recommended');
    return res.data;
  },

  getIndustries: async (): Promise<IndustryCategory[]> => {
    const res = await apiClient.get<IndustryCategory[]>('/companies/industries');
    return res.data;
  },

  getByHandle: async (handle: string): Promise<{ company: any; profile: any; following: boolean }> => {
    const res = await apiClient.get(`/companies/handle/${handle}`);
    return res.data;
  },

  followCompany: async (companyId: string): Promise<{ following: boolean }> => {
    const res = await apiClient.post('/companies/follow', { company_id: companyId });
    return res.data;
  },

  unfollowCompany: async (companyId: string): Promise<{ following: boolean }> => {
    const res = await apiClient.delete('/companies/follow', { data: { company_id: companyId } });
    return res.data;
  },

  saveCompany: async (companyId: string): Promise<{ saved: boolean }> => {
    const res = await apiClient.post('/companies/save', { company_id: companyId });
    return res.data;
  },

  unsaveCompany: async (companyId: string): Promise<{ saved: boolean }> => {
    const res = await apiClient.delete('/companies/save', { data: { company_id: companyId } });
    return res.data;
  },
};
