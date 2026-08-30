import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatRelativeTime } from '../shared/utils/date';
import { formatCurrency, formatSalaryRange, formatNumber, formatCompactNumber } from '../shared/utils/currency';
import { ROUTES } from '../shared/routes';

describe('Common Utilities & Routes', () => {
  it('formats dates consistently', () => {
    const fixedDate = new Date('2026-08-30T10:00:00Z');
    expect(formatDate(fixedDate)).toContain('2026');
    expect(formatDateTime(fixedDate)).toContain('2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats relative time gracefully', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('formats currency and compensation correctly', () => {
    expect(formatCurrency(15000, 'AED')).toContain('15,000');
    expect(formatCurrency(null)).toBe('—');
    expect(formatSalaryRange(10000, 20000, 'AED', 'month')).toContain('10,000');
    expect(formatSalaryRange(null, null)).toBe('Competitive');
    expect(formatNumber(1250000)).toBe('1,250,000');
    expect(formatCompactNumber(1500000)).toContain('1.5');
  });

  it('defines structured routes and helpers', () => {
    expect(ROUTES.HOME).toBe('/');
    expect(ROUTES.JOBS).toBe('/jobs');
    expect(ROUTES.JOB_DETAIL('123')).toBe('/jobs/123');
    expect(ROUTES.AUTH.LOGIN).toBe('/login');
    expect(ROUTES.ADMIN.DASHBOARD).toBe('/admin/dashboard');
  });
});
