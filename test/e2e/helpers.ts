import { expect, Locator } from '@playwright/test';

/**
 * Asserts a page anchor is present exactly once, then visible.
 *
 * These pages are server-rendered and then hydrated, and the client briefly
 * mounts a second copy of the tree before discarding the server one — the two
 * copies are visible as differing React ids on otherwise identical elements
 * (`_r_0_` against `_R_hl9kklubtfb_`). Any locator evaluated inside that window
 * resolves to two elements and trips Playwright's strict mode, which is why the
 * same tests failed on a different browser each run.
 *
 * Gating on the count both waits the window out and asserts that it closes: a
 * page that genuinely rendered its content twice would still fail here, so this
 * absorbs the race without hiding a duplicate.
 */
export async function settled(locator: Locator): Promise<void> {
  await expect(locator).toHaveCount(1);
  await expect(locator).toBeVisible();
}
