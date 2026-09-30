import { test, expect } from '@playwright/test';

// The AI tools are hidden for now (frontend/src/shared/features.ts). Every one
// of them runs on keyword heuristics rather than a language model, so none is
// offered as AI until one is connected. The career assistant, which lived at
// /career-assistant and redirects to /career-companion, answers not-found, as
// do the other AI pages.

test.describe('AI tools while hidden', () => {
  for (const path of ['/career-assistant', '/career-companion', '/resume-analysis', '/jobs/match', '/dashboard/interview-prep']) {
    test(`${path} answers not-found`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { name: /couldn.t find that page/i })).toBeVisible();
    });
  }
});
