import type { Workspace } from './types';

/**
 * Which workspace the current URL is in.
 *
 * The workspace follows the URL rather than being stored beside it. That is the
 * whole design: there is no "current workspace" variable to fall out of step
 * with the address bar, Back and Forward work without being taught to, a reload
 * lands where it left off, and a workspace that has been revoked simply stops
 * matching. Persisting a selection would add a second source of truth whose
 * only job is to disagree with the first.
 *
 * Matching is by longest route prefix, so /companies/acme/admin/jobs resolves to
 * the Acme workspace rather than to whichever company happened to be first.
 * Professional is the fallback, and its own route is not matched as a prefix -
 * it is what you get when nothing else claims the path.
 */
export function activeWorkspace(
  workspaces: Workspace[] | null | undefined,
  pathname: string | null | undefined
): Workspace | null {
  // Tolerates an absent list rather than throwing. This runs inside the app
  // shell, on every authenticated page, so the cost of being strict here is a
  // blank screen everywhere - and "no workspaces" already has a correct
  // meaning: no switcher, and no workspace-derived entries.
  if (!workspaces || workspaces.length === 0) return null;

  const fallback = workspaces.find(w => w.isDefault) ?? workspaces[0];
  if (!pathname) return fallback;

  let best: Workspace | null = null;
  for (const workspace of workspaces) {
    if (workspace === fallback) continue;
    if (!isUnder(pathname, workspace.route)) continue;
    if (!best || workspace.route.length > best.route.length) {
      best = workspace;
    }
  }
  return best ?? fallback;
}

/**
 * Whether a path sits inside a route.
 *
 * Segment-aware, so /recruiterly is not inside /recruiter. Comparing raw string
 * prefixes is the usual way that bug arrives, and it puts the user in a
 * workspace they never entered.
 */
function isUnder(pathname: string, route: string): boolean {
  if (route === '/' || route === '') return false;
  const path = stripTrailingSlash(pathname);
  const base = stripTrailingSlash(route);
  return path === base || path.startsWith(`${base}/`);
}

function stripTrailingSlash(value: string): string {
  return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value;
}
