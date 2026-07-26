export interface Enterprise {
  id: string;
  name: string;
  industry: string;
  tier: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

export interface HiringTeam {
  id: string;
  enterprise_id: string;
  department_name: string;
  team_name: string;
  team_lead_id: string;
  team_lead_name: string;
  member_count: number;
  created_at: string;
}

export interface CandidatePool {
  id: string;
  enterprise_id: string;
  name: string;
  description: string;
  candidate_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  enterprise_id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  resource: string;
  ip_address: string;
  created_at: string;
}

export interface CreateTeamPayload {
  department_name: string;
  team_name: string;
}

export interface CreatePoolPayload {
  name: string;
  description: string;
}
