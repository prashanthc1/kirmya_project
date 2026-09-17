import { authApiClient } from '../../services/api';
import {
  CreateOrganizationPayload,
  InviteMemberPayload,
  Organization,
  OrganizationPermission,
  OrganizationUser,
} from './types';

const getTenantHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return { 'X-Tenant-ID': '00000000-0000-0000-0000-000000000000' };
  }
  const tenantID = localStorage.getItem('active_tenant_id') || '00000000-0000-0000-0000-000000000000';
  return { 'X-Tenant-ID': tenantID };
};

export const organizationApi = {
  createOrganization: async (payload: CreateOrganizationPayload): Promise<{ message: string; organization: Organization }> => {
    const response = await authApiClient.post('/organizations', payload, { headers: getTenantHeaders() });
    return response.data;
  },

  getOrganizationsForUser: async (): Promise<{ data: Organization[]; count: number }> => {
    const response = await authApiClient.get('/organizations', { headers: getTenantHeaders() });
    return response.data;
  },

  addMember: async (orgId: string, payload: InviteMemberPayload): Promise<{ message: string; member: OrganizationUser }> => {
    const response = await authApiClient.post(`/organizations/${orgId}/members`, payload, { headers: getTenantHeaders() });
    return response.data;
  },

  getOrgMembers: async (orgId: string): Promise<{ data: OrganizationUser[]; count: number }> => {
    const response = await authApiClient.get(`/organizations/${orgId}/members`, { headers: getTenantHeaders() });
    return response.data;
  },

  getAllPermissions: async (): Promise<{ data: OrganizationPermission[]; count: number }> => {
    const response = await authApiClient.get('/organizations/permissions', { headers: getTenantHeaders() });
    return response.data;
  },
};

export default organizationApi;
