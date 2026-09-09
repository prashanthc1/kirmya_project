/**
 * Route matching for navigation active states.
 *
 * Three copies of `pathname === href || pathname.startsWith(href)` were spread
 * across AppHeader, AppSidebar and MobileBottomNav, and that check is wrong in
 * both directions: `/network` claimed `/networking`, `/jobs` claimed
 * `/jobs-report`, and nothing distinguished "this section is active" from "this
 * exact page is active", so a global tab and its own sub-tab could not be lit
 * differently. Matching lives here instead, and is tested.
 */

/** Strip the query and hash a `usePathname()` value should not contain anyway. */
const normalise = (path: string): string => {
  const clean = path.split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean || '/';
};

/**
 * Whether `pathname` is inside `href`, treating both as path segments.
 *
 * `/network` contains `/network/connections` but not `/networking`, because the
 * character after the prefix must be a separator.
 */
export const isWithin = (pathname: string, href: string): boolean => {
  const current = normalise(pathname);
  const target = normalise(href);
  if (target === '/') return current === '/';
  if (current === target) return true;
  return current.startsWith(target + '/');
};

/** Whether `pathname` is exactly `href`. */
export const isExactly = (pathname: string, href: string): boolean =>
  normalise(pathname) === normalise(href);

export interface MatchableItem {
  href: string;
  /** Match this item only on an exact path. Use for a section's own index. */
  exact?: boolean;
  /**
   * Extra paths that should also light this item — for a route that lives
   * outside its section's prefix, such as `/saved-jobs` under Jobs.
   */
  alsoMatches?: string[];
}

/** Whether one navigation item should be marked active for `pathname`. */
export const isItemActive = (pathname: string, item: MatchableItem): boolean => {
  if (item.exact) {
    if (isExactly(pathname, item.href)) return true;
  } else if (isWithin(pathname, item.href)) {
    return true;
  }
  return (item.alsoMatches ?? []).some(extra =>
    item.exact ? isExactly(pathname, extra) : isWithin(pathname, extra)
  );
};

/**
 * The single active item in a list.
 *
 * Longest href wins, so `/jobs/applications` lights Applications rather than
 * the Jobs index that also contains it. Returns null when nothing matches
 * rather than guessing, because a wrong highlight is worse than none.
 */
export const findActiveItem = <T extends MatchableItem>(
  pathname: string,
  items: readonly T[]
): T | null => {
  let best: T | null = null;
  let bestLength = -1;
  for (const item of items) {
    if (!isItemActive(pathname, item)) continue;
    const length = normalise(item.href).length;
    if (length > bestLength) {
      best = item;
      bestLength = length;
    }
  }
  return best;
};

/** The id of the active item, or null. Convenience for tab components. */
export const findActiveId = <T extends MatchableItem & { id: string }>(
  pathname: string,
  items: readonly T[]
): string | null => findActiveItem(pathname, items)?.id ?? null;
