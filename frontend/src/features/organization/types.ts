export type OrgType = 'company' | 'recruiter_agency' | 'training_provider';
export type OrgRole = 'org_admin' | 'recruiter' | 'instructor' | 'viewer';
export type OrgTier = 'basic' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  org_type: OrgType;
  tenant_domain: string;
  status: string;
  tier: OrgTier;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface OrganizationUser {
  id: string;
  org_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: OrgRole;
  status: string;
  created_at: string;
}

export interface OrganizationPermission {
  id: string;
  role: OrgRole;
  resource: string;
  action: string;
  created_at: string;
}

export interface CreateOrganizationPayload {
  name: string;
  org_type: OrgType;
  tenant_domain: string;
  tier?: OrgTier;
}

export interface InviteMemberPayload {
  user_email: string;
  user_name?: string;
  role: OrgRole;
}
