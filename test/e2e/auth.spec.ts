import { test, expect } from '@playwright/test';

test.describe('Authentication & User Identity Flow', () => {
  test('User Signup Flow', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="full_name"]', 'New Test User');
    await page.fill('input[name="email"]', `user-${Date.now()}@kirmya.com`);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Expect redirection to dashboard or confirmation
    await expect(page).toHaveURL(/.*(dashboard|profile|login)/);
  });

  test('User Login & Logout Flow', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'candidate.test@kirmya.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Expect successful login
    await expect(page).toHaveURL(/.*(dashboard|profile|jobs)/);

    // Logout
    await page.click('button[id="user-menu-button"]');
    await page.click('button[id="logout-button"]');
    await expect(page).toHaveURL(/.*(login|landing|$)/);
  });

  test('Forgot Password & Reset Password Flow', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.fill('input[name="email"]', 'candidate.test@kirmya.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password reset instructions sent')).toBeVisible();

    // Reset password with token
    await page.goto('/auth/reset-password?token=mock-valid-reset-token');
    await page.fill('input[name="new_password"]', 'NewSecurePass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password updated successfully')).toBeVisible();
  });
});
