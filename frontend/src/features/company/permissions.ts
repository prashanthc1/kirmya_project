/**
 * Company-scoped permission helpers.
 *
 * These decide which controls render. They are not a security boundary: the
 * server re-checks every permission on the request itself, and a caller who
 * forges a viewer context client-side gains nothing but a button that fails.
 * Authority is always scoped to one company — holding a role on company A says
 * nothing about company B, which is why every helper takes the viewer context
 * belonging to the company on screen.
 */
import { COMPANY_ROLES, CompanyPermission, CompanyRole, ROLE_LABELS } from './types';

/**
 * Anything carrying company-scoped authority. Both `ViewerContext` (on a public
 * company page) and `CompanyMembership` (in the dashboard switcher) satisfy it,
 * so the same helpers serve both without either shape being special.
 */
export interface PermissionHolder {
  roles?: CompanyRole[];
  permissions?: CompanyPermission[];
}

/** Whether the viewer holds a permission on the company the context came from. */
export const hasPermission = (
  viewer: PermissionHolder | undefined | null,
  permission: CompanyPermission
): boolean => !!viewer?.permissions?.includes(permission);

/** Whether the viewer holds every one of the given permissions. */
export const hasEveryPermission = (
  viewer: PermissionHolder | undefined | null,
  permissions: CompanyPermission[]
): boolean => permissions.every((permission) => hasPermission(viewer, permission));

/** Whether the viewer holds at least one of the given permissions. */
export const hasAnyPermission = (
  viewer: PermissionHolder | undefined | null,
  permissions: CompanyPermission[]
): boolean => permissions.some((permission) => hasPermission(viewer, permission));

/** Whether the viewer has any administrative reason to see the dashboard. */
export const canOpenDashboard = (viewer: PermissionHolder | undefined | null): boolean =>
  hasAnyPermission(viewer, [
    'company:edit',
    'team:view',
    'analytics:view',
    'job:view',
    'recruiter:view',
    'verification:view',
  ]);

/** Privilege rank, lowest number being the most privileged. Mirrors Role.Rank. */
export const roleRank = (role: CompanyRole): number => {
  const index = COMPANY_ROLES.indexOf(role);
  return index === -1 ? COMPANY_ROLES.length : index;
};

/** The most privileged role the viewer holds, if any. */
export const highestRole = (viewer: PermissionHolder | undefined | null): CompanyRole | null => {
  if (!viewer?.roles?.length) return null;
  return viewer.roles.reduce((best, role) => (roleRank(role) < roleRank(best) ? role : best));
};

/**
 * Which roles the viewer may hand out. Mirrors Grant.CanAssign: nobody grants a
 * role at or above their own level, and only the owner can pass ownership on.
 * Getting this wrong client-side would only produce a rejected request, but
 * offering a role the server will refuse is a broken screen either way.
 */
export const assignableRoles = (viewer: PermissionHolder | undefined | null): CompanyRole[] => {
  if (!hasAnyPermission(viewer, ['team:manage', 'recruiter:manage'])) return [];
  const actor = highestRole(viewer);
  if (!actor) return [];

  return COMPANY_ROLES.filter((role) => {
    if (role === 'company_owner') return actor === 'company_owner';
    return roleRank(role) > roleRank(actor);
  });
};

export const roleLabel = (role: CompanyRole): string => ROLE_LABELS[role] ?? role;

/** Turns `team:invite` into `Team · Invite` for the permission matrix. */
export const permissionLabel = (permission: CompanyPermission): string =>
  permission
    .split(':')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' · ');
