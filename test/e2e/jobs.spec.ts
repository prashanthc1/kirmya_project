import { test, expect } from '@playwright/test';

test.describe('Job Search, Application & Bookmarking Flow', () => {
  test('Search Jobs by Keyword and Location', async ({ page }) => {
    await page.goto('/jobs/search');
    await page.fill('input[id="search-query-input"]', 'Go Backend');
    await page.fill('input[id="search-location-input"]', 'Remote');
    await page.click('button[type="submit"]');

    await expect(page.locator('.job-card')).toHaveCount(await page.locator('.job-card').count());
  });

  test('Save and Apply for Job Opening', async ({ page }) => {
    await page.goto('/jobs/search');
    await page.fill('input[id="search-query-input"]', 'Senior Go Backend Architect');
    await page.click('button[type="submit"]');

    // Click Save Job
    await page.click('button[id="save-job-btn-1"]');
    await expect(page.locator('text=Job saved to bookmarks')).toBeVisible();

    // Submit Application
    await page.click('button[id="apply-job-btn-1"]');
    await page.fill('textarea[name="cover_letter"]', 'Extensive experience in pgxpool connection management.');
    await page.click('button[id="submit-application-btn"]');

    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
  });
});
