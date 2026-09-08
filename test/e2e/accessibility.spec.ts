import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { publishJob } from './helpers';

/**
 * F15. The core journey must be usable by someone who cannot see it well.
 *
 * The finding was that no automated accessibility check ran anywhere in this
 * repository, and a scan found real defects behind that silence: every filled
 * button on the site failed WCAG AA on contrast, including the submit button on
 * sign-in and registration. White on the dark-mode primary #818cf8 measured
 * 2.98:1 against a required 4.5:1; the "FOR ENTERPRISES" eyebrow measured
 * 2.11:1 in light mode.
 *
 * These tests run axe against the pages a person actually passes through to
 * apply for a job, in both colour modes, at desktop and phone widths. The
 * project matrix supplies the widths; each test seeds the mode, because the app
 * defaults to dark and reads the choice from localStorage.
 *
 * The bar is zero serious or critical violations. Moderate and minor findings
 * are reported, not failed on: they are worth seeing without blocking a release
 * on a landmark ordering nit.
 */

const CORE_JOURNEY = ['/', '/jobs', '/signin', '/register', '/forgot-password'];

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Seeds the colour mode before the page's first paint. */
async function useColorMode(page: Page, mode: 'light' | 'dark') {
  await page.addInitScript((m) => {
    try {
      window.localStorage.setItem('kirmya-theme-mode', m as string);
    } catch {
      // A browser with storage blocked still renders; the default mode applies.
    }
  }, mode);
}

/** Scans one page and returns its violations, worst first. */
async function scan(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // Sections animate in and the board fetches its first page; scanning before
  // that settles would measure an empty document and pass for the wrong reason.
  await page.waitForTimeout(1500);
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return results.violations;
}

for (const mode of ['dark', 'light'] as const) {
  test.describe(`accessibility (${mode} mode)`, () => {
    for (const path of CORE_JOURNEY) {
      test(`${path} has no serious or critical violations`, async ({ page }) => {
        await useColorMode(page, mode);
        const violations = await scan(page, path);

        const blocking = violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical'
        );

        // Name the offending element in the failure. "1 violation" sends the
        // next person back to the browser to find out which one.
        const detail = blocking
          .map((v) => {
            const nodes = v.nodes
              .slice(0, 5)
              .map((n) => `      ${n.target.join(' ')}\n      ${n.html.slice(0, 140)}`)
              .join('\n');
            return `  [${v.impact}] ${v.id}: ${v.help}\n${nodes}`;
          })
          .join('\n');

        expect(blocking, `${path} in ${mode} mode:\n${detail}`).toEqual([]);

        for (const v of violations) {
          console.log(`  note: ${path} [${v.impact}] ${v.id} (${v.nodes.length} nodes)`);
        }
      });
    }
  });
}

test.describe('accessibility of the posting itself', () => {
  test('a job detail page has no serious or critical violations', async ({ page, request }) => {
    test.slow();
    const api = process.env.TEST_API_URL;
    expect(api, 'TEST_API_URL is mandatory').toBeTruthy();

    // Seed the posting rather than reading whatever the board holds: this page
    // is server-rendered from the API, so its headings and landmarks come from
    // live data, and a spec that skipped on an empty board would fail the CI
    // gate that rejects skips.
    const job = await publishJob(request, api!);

    await useColorMode(page, 'dark');
    const violations = await scan(page, `/jobs/${job.id}`);
    const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    expect(
      blocking,
      blocking.map((v) => `[${v.impact}] ${v.id}: ${v.nodes[0]?.html.slice(0, 140)}`).join('\n')
    ).toEqual([]);
  });
});

test.describe('keyboard access', () => {
  test('sign-in can be completed without a mouse', async ({ page }) => {
    // Contrast is only half of F15. A form that can be seen but not reached by
    // tab is still unusable, and this is the narrowest path into the product.
    await page.goto('/signin', { waitUntil: 'domcontentloaded' });

    const email = page.getByLabel(/email/i).first();
    await email.focus();
    await expect(email).toBeFocused();

    await page.keyboard.type('keyboard@example.invalid');

    // Tab forward until the submit control takes focus. The password field may
    // carry a visibility toggle between the two, so this walks rather than
    // assuming an exact tab count.
    const submit = page.getByRole('button', { name: /sign in/i }).first();
    let reached = false;
    for (let i = 0; i < 12 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      reached = await submit.evaluate((el) => el === document.activeElement).catch(() => false);
    }

    expect(reached, 'the sign-in button cannot be reached from the email field by tabbing').toBe(true);

    // And the focused control must be visible: a focus ring that renders as
    // nothing leaves a keyboard user with no idea where they are.
    const outline = await submit.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
    });
    expect(
      outline.outlineWidth !== '0px' || outline.boxShadow !== 'none',
      'the focused submit button has no visible focus indicator'
    ).toBe(true);
  });
});
