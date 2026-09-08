import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 20_000,
  reporter: [['html', { open: 'never' }], ['json', { outputFile: 'artifacts/playwright.json' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
    command: 'npm --prefix frontend run start -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000/signin',
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe', stderr: 'pipe',
  },
});
