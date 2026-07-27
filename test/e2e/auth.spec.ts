import { test, expect } from '@playwright/test';

test.describe('Authentication & User Identity Flow', () => {
  test('User Signin Page & Form Validation', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('text=Sign In to Kirmya')).toBeVisible();
    await expect(page.locator('text=Helping professionals restart their careers faster.')).toBeVisible();

    // Trigger validation
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email address is required')).toBeVisible();

    // Invalid email format
    await page.fill('input[type="email"]', 'invalid-email-format');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('User Signup Flow', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'New');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', `user-${Date.now()}@kirmya.com`);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Expect redirection to dashboard or confirmation
    await expect(page).toHaveURL(/.*(dashboard|profile|signin|login)/);
  });

  test('User Login & Role Redirect Flow', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'candidate.test@kirmya.com');
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Expect successful login
    await expect(page).toHaveURL(/.*(dashboard|profile|jobs)/);
  });

  test('Forgot Password & Reset Password Flow', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', 'candidate.test@kirmya.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password reset instructions sent')).toBeVisible();

    // Reset password with token
    await page.goto('/reset-password?token=mock-valid-reset-token');
    await page.fill('input[name="new_password"]', 'NewSecurePass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password updated successfully')).toBeVisible();
  });
});
