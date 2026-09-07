// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  CreateOrganizationPayload,
  InviteMemberPayload,
  Organization,
  OrganizationPermission,
  OrganizationUser,
} from './types';

const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';


client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  // Tenant header support
  const tenantID = localStorage.getItem('active_tenant_id') || '00000000-0000-0000-0000-000000000000';
  config.headers['X-Tenant-ID'] = tenantID;
  return config;
});

export const organizationApi = {
  createOrganization: async (payload: CreateOrganizationPayload): Promise<{ message: string; organization: Organization }> => {
    const response = await client.post('/organizations', payload);
    return response.data;
  },

  getOrganizationsForUser: async (): Promise<{ data: Organization[]; count: number }> => {
    const response = await client.get('/organizations');
    return response.data;
  },

  addMember: async (orgId: string, payload: InviteMemberPayload): Promise<{ message: string; member: OrganizationUser }> => {
    const response = await client.post(`/organizations/${orgId}/members`, payload);
    return response.data;
  },

  getOrgMembers: async (orgId: string): Promise<{ data: OrganizationUser[]; count: number }> => {
    const response = await client.get(`/organizations/${orgId}/members`);
    return response.data;
  },

  getAllPermissions: async (): Promise<{ data: OrganizationPermission[]; count: number }> => {
    const response = await client.get('/organizations/permissions');
    return response.data;
  },
};

export default organizationApi;
