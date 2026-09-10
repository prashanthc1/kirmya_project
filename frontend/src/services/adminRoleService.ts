import { api } from './api';

/**
 * Administrative roles, as the server defines them.
 *
 * The console used to hold its own list of five roles with invented assignment
 * counts, and its assign button set a success message without calling anything.
 * An administrator was told a role had been granted when no request had left
 * the browser. Everything here is the server's answer.
 */

export interface AdminRole {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
}

/** The roles the platform defines, seeded by migration 0099. */
export async function listAdminRoles(): Promise<AdminRole[]> {
  const res = await api.get<AdminRole[]>('/admin/roles');
  return Array.isArray(res.data) ? res.data : [];
}

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Find an account by email, so an assignment can be made against a real id.
 *
 * The API assigns by user id; people know each other by email. This is the
 * lookup between the two, and it deliberately returns nothing rather than a
 * near-match: assigning an administrative role to the wrong account because a
 * search was fuzzy is not a mistake worth being convenient about.
 */
export async function findAdminUserByEmail(email: string): Promise<AdminUserSummary | null> {
  const wanted = email.trim().toLowerCase();
  if (!wanted) return null;

  const res = await api.get<{ users?: AdminUserSummary[] } | AdminUserSummary[]>(
    `/admin/users?search=${encodeURIComponent(wanted)}&limit=25`
  );
  const list = Array.isArray(res.data) ? res.data : (res.data?.users ?? []);
  return list.find(candidate => candidate.email?.trim().toLowerCase() === wanted) ?? null;
}

/**
 * Narrow what an administrator may do.
 *
 * Assigning is a narrowing, not a grant: an account with no assignment holds
 * every administrative permission, so the first role given to anyone can only
 * take access away. It cannot make somebody an administrator - users.role_id
 * decides that, and the server refuses this call from anyone it does not
 * already admit.
 */
export async function assignAdminRole(input: {
  userId: string;
  roleCode: string;
  reason: string;
}): Promise<void> {
  await api.post('/admin/roles/assign', input);
}

/** Remove an assignment, widening the account back towards the default. */
export async function revokeAdminRole(input: {
  userId: string;
  roleCode: string;
  reason: string;
}): Promise<void> {
  await api.post('/admin/roles/revoke', input);
}
