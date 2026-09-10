import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';

/*
 * CI runs this config once per suite (05-e2e-smoke.yml) or once per engine
 * (06-e2e-full.yml), each in its own runner with its own PostgreSQL, Redis, API
 * and frontend. Nothing below may assume a shared server or a fixed test order.
 */
const ci = !!process.env.CI;

/*
 * File-level parallelism only.
 *
 * `fullyParallel: false` keeps the tests inside one file on one worker, so a
 * file that walks an account through several steps stays in order, while
 * separate files run side by side. Every spec seeds its own accounts and
 * postings with a timestamped, random suffix (test/e2e/helpers.ts), so two
 * files never contend for the same row.
 *
 * Two workers rather than four: the runner also hosts PostgreSQL, Redis, the Go
 * API and the Next standalone server on four vCPUs, and registration is bcrypt
 * at cost 12. More workers here buy queueing, not throughput, and the resulting
 * timeouts would read as product flake.
 */
const workers = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : ci
    ? 2
    : 1;

/*
 * `list` stays in CI because the workflow tees this output into
 * artifacts/playwright.log, which is the first thing anyone reads on a failure;
 * `github` adds the annotation on the failing line.
 */
const reporter: ReporterDescription[] = [
  ['html', { open: 'never' }],
  // Mandatory: scripts/ci/check-results.mjs reads this file and fails the job
  // on a failure, a skip, a flake, an empty report or a missing one.
  ['json', { outputFile: 'artifacts/playwright.json' }],
  ['list'],
  ...(ci ? [['github'] as ReporterDescription] : []),
];

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  forbidOnly: ci,
  /*
   * One retry in CI, for evidence rather than for green.
   *
   * scripts/ci/check-results.mjs rejects a report with `flaky` set, so a test
   * that fails and then passes still fails the build. The retry exists to
   * produce a second trace and a video of the failure, and to say whether it
   * reproduces - it cannot hide anything.
   */
  retries: ci ? 1 : 0,
  workers,
  // Contention between two workers costs wall-clock inside a test without
  // changing what it asserts; the specs that genuinely need longer still call
  // test.slow().
  timeout: ci ? 30_000 : 20_000,
  expect: { timeout: ci ? 10_000 : 5_000 },
  reporter,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Recording every attempt costs CPU the workers need. In CI the first
    // attempt is traced and screenshotted, and the retry - which only happens
    // after a failure - is filmed.
    video: ci ? 'on-first-retry' : 'retain-on-failure',
  },
  projects: [
    /*
     * The functional specs run on every engine, because the defects they guard
     * (hydration races, cookie handling, redirect behaviour) genuinely differ
     * between them.
     *
     * The accessibility scan does not: axe reads the DOM, ARIA and computed
     * styles, so a contrast or label defect is the same defect on all four.
     * Running it four times would quadruple the runtime and the flake surface
     * for no additional finding, so it gets its own two projects instead — one
     * desktop, one phone — because what does change with the viewport is which
     * elements are rendered at all.
     */
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /accessibility\.spec\.ts/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /accessibility\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /accessibility\.spec\.ts/ },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testIgnore: /accessibility\.spec\.ts/ },
    { name: 'a11y-desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /accessibility\.spec\.ts/ },
    { name: 'a11y-mobile', use: { ...devices['Pixel 7'] }, testMatch: /accessibility\.spec\.ts/ },
  ],
  webServer: {
    /*
     * The production artifact, served the way the image serves it.
     *
     * frontend/next.config.mjs sets `output: 'standalone'` and
     * frontend/Dockerfile runs `node server.js` from that tree. `next start`
     * announces that it does not work with that configuration and serves
     * through a different path, so a suite driven by `next start` was verifying
     * a server no deployment runs. This launcher copies the static assets and
     * `public/` beside the standalone server, exactly as the Dockerfile does,
     * and starts the same entry point.
     */
    command: 'node scripts/ci/start-standalone.mjs',
    url: 'http://127.0.0.1:3000/signin',
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe', stderr: 'pipe',
  },
});
