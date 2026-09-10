/**
 * Where to land when nothing else says.
 *
 * The active workspace follows the URL — see ./active — and that does not
 * change here. This answers the one question the URL cannot: where to go when
 * there is no URL yet, which is signing in without a returnUrl, and nowhere
 * else. A caller that consults this while a path is available has misread it.
 *
 * The rule, in precedence order:
 *
 *   1. An explicit returnUrl, once it has passed getSafeReturnUrl. Someone who
 *      asked for a page wants that page, and a remembered workspace must not
 *      override an intent stated in the request.
 *   2. The remembered workspace, if the server served one.
 *   3. The feed.
 *
 * The server only serves a remembered key when it still names one of the
 * workspaces served beside it, so the lookup below fails closed by
 * construction: an unknown key finds no workspace and falls through to the
 * feed. Nothing here decides whether the account may enter anywhere — the route
 * it lands on authorizes its own request, exactly as it did before any of this
 * existed, and landing somewhere is not being admitted.
 */
import { ROUTES } from '../routes';
import type { Workspace } from './types';

/**
 * The route for a remembered workspace key, or null when there is none to use.
 *
 * Null covers every uninteresting case together, because the caller does the
 * same thing in all of them: no key was served, the key names nothing in the
 * list, or the workspace it names carries no route.
 */
export function rememberedRoute(
  workspaces: Workspace[] | null | undefined,
  lastWorkspaceKey: string | null | undefined
): string | null {
  if (!lastWorkspaceKey || !workspaces || workspaces.length === 0) return null;

  const workspace = workspaces.find(candidate => candidate.key === lastWorkspaceKey);
  if (!workspace) return null;

  const route = workspace.route?.trim();
  // Only an in-application absolute path is a destination. This mirrors the
  // shape check getSafeReturnUrl applies to a returnUrl: the value arrives from
  // the network in both cases, and a redirect target is worth being dull about.
  if (!route || !route.startsWith('/') || route.startsWith('//')) return null;

  return route;
}

/**
 * The post-sign-in destination.
 *
 * `safeReturnUrl` is the already-validated returnUrl, and `hadReturnUrl` says
 * whether one was actually asked for — the two are separate because
 * getSafeReturnUrl answers the feed both for "no returnUrl" and for "a
 * returnUrl I refused", and only the first of those may be replaced by a
 * remembered workspace. Honouring a remembered workspace after refusing a
 * returnUrl would quietly redirect someone who asked for somewhere specific.
 */
export function landingRoute(options: {
  safeReturnUrl: string;
  hadReturnUrl: boolean;
  workspaces: Workspace[] | null | undefined;
  lastWorkspaceKey: string | null | undefined;
}): string {
  const { safeReturnUrl, hadReturnUrl, workspaces, lastWorkspaceKey } = options;

  if (hadReturnUrl) return safeReturnUrl;

  return rememberedRoute(workspaces, lastWorkspaceKey) ?? ROUTES.FEED;
}
