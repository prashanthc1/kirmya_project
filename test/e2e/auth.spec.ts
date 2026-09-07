import { test, expect } from '@playwright/test';
import { settled } from './helpers';

// Every assertion below is anchored to markup that exists in
// frontend/src/components/auth and frontend/src/app/{signin,register,forgot-password,reset-password}.
// Client-side validation only: no account is created, so the CI database stays
// empty and these stay deterministic across reruns.
//
// Each page is identified by its <h1> through settled(), which also waits out
// the hydration double-mount described in helpers.ts before anything is
// clicked or filled.

test.describe('Authentication & User Identity Flow', () => {
  test('Sign in page renders and rejects a malformed email', async ({ page }) => {
    await page.goto('/signin');

    await settled(page.getByRole('heading', { name: 'Sign In to Kirmya' }));

    // Empty submit surfaces the required-field messages from signInSchema.
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Email address is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();

    await page.getByRole('textbox', { name: 'Email Address' }).fill('invalid-email-format');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('Registration form enforces its schema before calling the API', async ({ page }) => {
    await page.goto('/register');

    await settled(page.getByRole('heading', { name: 'Create your account' }));

    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Email address is required')).toBeVisible();

    await page.getByRole('textbox', { name: 'First Name' }).fill('New');
    await page.getByRole('textbox', { name: 'Last Name' }).fill('User');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('candidate@example.invalid');
    await page.getByLabel('Password (min 12 characters)').fill('short');
    await page.getByLabel('Confirm Password').fill('short');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Password must be at least 12 characters long')).toBeVisible();
    // Nothing was submitted, so the page must not have navigated away.
    await expect(page).toHaveURL(/\/register$/);
  });

  test('Forgot password rejects a malformed address before sending', async ({ page }) => {
    await page.goto('/forgot-password');

    await settled(page.getByRole('heading', { name: 'Forgot Password' }));

    await page.getByRole('textbox', { name: 'Email Address' }).fill('not-an-address');
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  });

  test('Reset password refuses a tokenless link and a weak password', async ({ page }) => {
    // No token in the query string: the page must say so rather than render a form
    // that would post an empty token.
    await page.goto('/reset-password');
    await settled(page.getByRole('heading', { name: 'Reset link is incomplete' }));

    await page.goto('/reset-password?token=ci-placeholder-token');
    await settled(page.getByRole('heading', { name: 'Reset Password' }));

    await page.getByLabel('New Password (min 12 characters)').fill('short');
    await page.getByLabel('Confirm New Password').fill('short');
    await page.getByRole('button', { name: 'Set New Password' }).click();

    await expect(page.getByText('Password must be at least 12 characters long')).toBeVisible();
  });
});
