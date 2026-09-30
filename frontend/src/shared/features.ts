/**
 * Product areas that are built but hidden for now.
 *
 * Hidden is not deleted: the pages, components and API stay in the codebase,
 * and turning an area back on is removing its prefixes from this list and from
 * the matcher in src/proxy.ts. While an area is listed here:
 *
 * - its pages answer 404 (src/proxy.ts rewrites them to the not-found page),
 * - no navigation, menu or button links to it (callers filter with
 *   `isHiddenRoute`, or check `FEATURES` before rendering an entry point).
 *
 * AI: every "AI" feature runs on the local keyword heuristics in
 * backend/internal/shared/ai, not a language model, so none of them is shown
 * as AI until one is connected. Networking and messaging are hidden until the
 * marketplace has the users to make them worth having.
 */
export const FEATURES = {
  ai: false,
  networking: false,
  messaging: false,
} as const;

export const HIDDEN_ROUTE_PREFIXES: readonly string[] = [
  // AI
  '/career-companion',
  '/resume-analysis',
  '/jobs/match',
  '/ai-job-match',
  '/recruiter/ai-workspace',
  '/interview-prep',
  '/dashboard/interview-prep',
  '/recommendations',
  '/analytics/workforce-intelligence',
  // Networking
  '/network',
  '/networking',
  '/people',
  '/notifications/network',
  // Messaging
  '/messages',
  '/recruiter/messages',
  '/notifications/messages',
];

/**
 * Whether a path, or an href with a query string or fragment, is inside a
 * hidden area. Prefixes match whole segments: `/network` hides
 * `/network/connections` but not `/networking-events`.
 */
export function isHiddenRoute(href: string): boolean {
  const path = href.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  return HIDDEN_ROUTE_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

/** Drops the items whose href is inside a hidden area. */
export function visibleItems<T extends { href?: string; route?: string }>(items: readonly T[]): T[] {
  return items.filter(item => {
    const href = item.href ?? item.route;
    return !href || !isHiddenRoute(href);
  });
}
