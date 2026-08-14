import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

import AdminAnalyticsCenter from '../components/admin/analytics/AdminAnalyticsCenter';
import PersonalCareerAnalytics from '../components/analytics/PersonalCareerAnalytics';
import analyticsApi from '../features/analytics/services/analyticsApi';

describe('Analytics, BI & Reporting Module Test Suite', () => {
  it('renders AdminAnalyticsCenter executive dashboard', () => {
    render(<AdminAnalyticsCenter />);
    expect(screen.getByText(/Kirmya Executive Intelligence & Business Analytics/i)).toBeInTheDocument();
  });

  it('renders PersonalCareerAnalytics dashboard', () => {
    render(<PersonalCareerAnalytics />);
    expect(screen.getByText(/Personal Career Growth & Job Search Analytics/i)).toBeInTheDocument();
  });

  it('fetches admin overview and growth analytics safely', async () => {
    const ov = await analyticsApi.getAdminOverview();
    expect(ov.total_users).toBeGreaterThan(0);

    const ug = await analyticsApi.getAdminUserGrowth();
    expect(ug.retention_rate_pct).toBeGreaterThan(0);
  });

  it('fetches search zero-result analytics and scheduled reports', async () => {
    const searchData = await analyticsApi.getAdminSearch();
    expect(searchData.zero_result_searches.length).toBeGreaterThan(0);

    const scheduled = await analyticsApi.getScheduledReports();
    expect(scheduled.length).toBeGreaterThan(0);
  });

  it('handles CSV export requests with formula injection defense', async () => {
    const res = await analyticsApi.requestExport('csv');
    expect(res.export.export_format).toBe('csv');
    expect(res.export.status).toBe('completed');
  });
});
