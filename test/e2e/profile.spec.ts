import { test, expect } from '@playwright/test';

test.describe('User Profile Management & Resume Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate test user session
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'candidate.test@kirmya.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
  });

  test('Create and Update Profile Information', async ({ page }) => {
    await page.goto('/profile/me');
    await page.click('button[id="edit-profile-btn"]');

    await page.fill('input[name="headline"]', 'Staff Go Microservices Architect');
    await page.fill('textarea[name="summary"]', '10+ years optimizing high-concurrency Go services & PostgreSQL databases.');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Staff Go Microservices Architect')).toBeVisible();
  });

  test('Upload Resume PDF Attachment', async ({ page }) => {
    await page.goto('/profile/resume');
    
    // Set file payload
    const filePayload = {
      name: 'resume_alex_rivera.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF Content for Resume Upload Test'),
    };

    await page.setInputFiles('input[type="file"]', filePayload);
    await page.click('button[id="upload-resume-btn"]');

    await expect(page.locator('text=Resume uploaded and parsed successfully')).toBeVisible();
  });
});
