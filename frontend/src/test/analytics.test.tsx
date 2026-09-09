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
import PerformanceDashboard from '../components/analytics/PerformanceDashboard';
import TrustSafetyAnalyticsCard from '../components/analytics/TrustSafetyAnalyticsCard';
import UserConsentToggleModal from '../components/analytics/UserConsentToggleModal';
import ScheduledReportDialog from '../components/analytics/ScheduledReportDialog';
import FunnelChart from '../components/analytics/FunnelChart';
import CohortTable from '../components/analytics/CohortTable';
import analyticsApi from '../features/analytics/services/analyticsApi';

describe('Analytics, BI & Reporting Module Test Suite', () => {
  /*
   * Six tests here asserted figures the client invented when its request
   * failed: total_users above zero, a retention rate, zero-result searches, a
   * consent record. The suite disables the network, so every one of those calls
   * failed and a catch block supplied the answer - the assertions were reading
   * the fallback, not the API.
   *
   * The fallbacks are gone. What is worth pinning is that a failed analytics
   * request is reported, so that a console shows an error instead of a figure
   * nobody measured.
   */
  it('report a failed request rather than answering with invented figures', async () => {
    await expect(analyticsApi.getAdminOverview()).rejects.toThrow();
    await expect(analyticsApi.getAdminUserGrowth()).rejects.toThrow();
    await expect(analyticsApi.getAdminSearch()).rejects.toThrow();
    await expect(analyticsApi.getPerformanceAnalytics()).rejects.toThrow();
    await expect(analyticsApi.getTrustSafetyAnalytics()).rejects.toThrow();
  });

  it('renders AdminAnalyticsCenter executive dashboard', () => {
    render(<AdminAnalyticsCenter />);
    expect(screen.getByText(/Kirmya Executive Intelligence & Business Analytics/i)).toBeInTheDocument();
  });

  it('renders PersonalCareerAnalytics dashboard', () => {
    render(<PersonalCareerAnalytics />);
    expect(screen.getByText(/Personal Career Growth & Job Search Analytics/i)).toBeInTheDocument();
  });

  it('renders PerformanceDashboard telemetry widget', async () => {
    render(<PerformanceDashboard />);
    expect(await screen.findByText(/System Performance Telemetry/i)).toBeInTheDocument();
  });

  it('renders TrustSafetyAnalyticsCard moderation widget', async () => {
    render(<TrustSafetyAnalyticsCard />);
    expect(await screen.findByText(/Trust & Safety Moderation Metrics/i)).toBeInTheDocument();
  });

  it('renders UserConsentToggleModal privacy dialog', () => {
    render(<UserConsentToggleModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Privacy & Analytics Data Preferences/i)).toBeInTheDocument();
  });

  it('renders ScheduledReportDialog cron digest setup', () => {
    render(<ScheduledReportDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Schedule Executive Automated Digest/i)).toBeInTheDocument();
  });

  it('renders FunnelChart component', () => {
    render(
      <FunnelChart
        title="Application Conversion"
        stages={[
          { stage: 'Viewed', count: 100, percentage: 100 },
          { stage: 'Applied', count: 40, percentage: 40 },
        ]}
      />
    );
    expect(screen.getByText(/Application Conversion/i)).toBeInTheDocument();
  });

  it('renders CohortTable component', () => {
    render(<CohortTable />);
    expect(screen.getByText(/User Retention Cohorts/i)).toBeInTheDocument();
  });

});
