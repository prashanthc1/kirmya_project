import { describe, it, expect } from 'vitest';
import { getSafeReturnUrl } from '../components/auth/SignInForm';
import { ROUTES } from '../shared/routes';

describe('sign-in destination', () => {
  it('sends a normal user to the feed', () => {
    expect(getSafeReturnUrl(null)).toBe('/feed');
    expect(ROUTES.FEED).toBe('/feed');
  });

  it('preserves a safe return path', () => {
    expect(getSafeReturnUrl('/jobs/123')).toBe('/jobs/123');
    expect(getSafeReturnUrl('/companies/acme/admin/jobs')).toBe('/companies/acme/admin/jobs');
  });

  it('never forwards off this application', () => {
    for (const hostile of [
      'https://evil.example/steal',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'http://evil.example',
      '/jobs\nLocation: https://evil.example',
    ]) {
      expect(getSafeReturnUrl(hostile), `${hostile} was followed`).toBe('/feed');
    }
  });
});
