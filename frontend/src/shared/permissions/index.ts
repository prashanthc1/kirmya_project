/**
 * Navigation permission checks, in one place.
 *
 * Before this, "may this person see the admin console?" was answered by
 * `user.role === 'admin'` written out wherever it was needed, which is both
 * scattered and wrong: the API gates administrative routes on the role set
 * {admin, super_admin, platform_admin}, so a platform_admin was shown nothing.
 *
 * These decide which controls render. They are not the security boundary — the
 * API re-checks every one of them on the request itself, and a viewer who
 * forges a permission client-side gains a button that fails. Entity authority
 * is always scoped to the entity on screen: holding a role on company A says
 * nothing about company B, which is why each helper takes the viewer context
 * belonging to that entity rather than a global flag.
 */

/** The permission string the API grants an administrator in `/auth/me`. */
export const PLATFORM_ADMIN_PERMISSION = 'admin:access';

/** Roles the API's own RequireAdmin() lets through. Keep in step with it. */
export const PLATFORM_ADMIN_ROLES = ['admin', 'super_admin', 'platform_admin'] as const;

export interface Viewer {
  /** Effective permissions from `/auth/me`. */
  permissions?: string[] | null;
  /** The account's platform role. */
  role?: string | null;
  roleId?: string | null;
}

/** Roles that carry management authority over an entity, whatever its type. */
const ENTITY_MANAGER_ROLES = ['owner', 'admin', 'moderator', 'company_owner', 'company_admin'];

/** Anything carrying entity-scoped authority: a membership, a viewer context. */
export interface EntityViewer {
  role?: string | null;
  roles?: string[] | null;
  permissions?: string[] | null;
  /** Some endpoints answer with a plain boolean; honour it when present. */
  canManage?: boolean | null;
}

const holdsManagementRole = (viewer: EntityViewer | null | undefined): boolean => {
  if (!viewer) return false;
  if (viewer.canManage === true) return true;
  const roles = [viewer.role, ...(viewer.roles ?? [])].filter(Boolean) as string[];
  return roles.some(role => ENTITY_MANAGER_ROLES.includes(role.toLowerCase()));
};

/** Whether the viewer may open the platform administration console. */
export const canAccessPlatformAdmin = (viewer: Viewer | null | undefined): boolean => {
  if (!viewer) return false;
  if (viewer.permissions?.includes(PLATFORM_ADMIN_PERMISSION)) return true;
  const role = (viewer.role ?? viewer.roleId ?? '').toLowerCase();
  return (PLATFORM_ADMIN_ROLES as readonly string[]).includes(role);
};

/**
 * Whether the viewer may manage this company.
 *
 * `viewer` is the company-scoped context for the company on screen. A viewer
 * with no context manages nothing — the absence of an answer is never taken as
 * a yes.
 */
export const canManageCompany = (viewer: EntityViewer | null | undefined): boolean => {
  if (!viewer) return false;
  const permissions = viewer.permissions ?? [];
  if (permissions.some(p => p.startsWith('company:') || p.startsWith('job:') || p.startsWith('team:'))) {
    return true;
  }
  return holdsManagementRole(viewer);
};

/** Whether the viewer may manage this community. */
export const canManageCommunity = (viewer: EntityViewer | null | undefined): boolean =>
  holdsManagementRole(viewer) ||
  (viewer?.permissions ?? []).some(p => p.startsWith('community:'));

/** Whether the viewer may manage this page. */
export const canManagePage = (viewer: EntityViewer | null | undefined): boolean =>
  holdsManagementRole(viewer) || (viewer?.permissions ?? []).some(p => p.startsWith('page:'));

export type EntityKind = 'company' | 'community' | 'page';

/** One entry point, for callers that already hold the entity kind as data. */
export const canManageEntity = (
  kind: EntityKind,
  viewer: EntityViewer | null | undefined
): boolean => {
  switch (kind) {
    case 'company':
      return canManageCompany(viewer);
    case 'community':
      return canManageCommunity(viewer);
    case 'page':
      return canManagePage(viewer);
    default:
      return false;
  }
};
