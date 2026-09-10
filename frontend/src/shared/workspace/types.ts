/**
 * Workspaces, as the server describes them.
 *
 * This mirrors the contract served by GET /api/v1/auth/me. It is navigation
 * data and nothing else: it carries a label and a route, never a permission.
 * No code may read a workspace to decide whether something is allowed — the
 * server decides that again on every request, and a client that starts making
 * authorization decisions from this list has invented a second, weaker one.
 */

export type WorkspaceType =
  | 'professional'
  | 'freelancer'
  | 'recruiting'
  | 'company'
  | 'community_admin'
  | 'platform_admin';

export interface Workspace {
  /** Stable identity, unique within one list. Never the label. */
  key: string;
  type: WorkspaceType;
  /** The company or community this names, for entity-scoped types. */
  entityId?: string;
  label: string;
  slug?: string;
  route: string;
  isDefault: boolean;
}

/**
 * How the switcher groups workspaces, in the order the architecture specifies:
 * the personal capabilities first, then the entities the account manages, then
 * platform administration on its own.
 */
export type WorkspaceGroup = 'personal' | 'entity' | 'platform';

export function groupOf(type: WorkspaceType): WorkspaceGroup {
  switch (type) {
    case 'company':
    case 'community_admin':
      return 'entity';
    case 'platform_admin':
      return 'platform';
    default:
      return 'personal';
  }
}

export const GROUP_ORDER: WorkspaceGroup[] = ['personal', 'entity', 'platform'];
