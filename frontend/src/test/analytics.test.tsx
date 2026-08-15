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

  it('fetches system performance telemetry and trust safety analytics', async () => {
    const perf = await analyticsApi.getPerformanceAnalytics();
    expect(perf.p50_latency_ms).toBeGreaterThan(0);
    expect(perf.otel_exporter_status).toBe('healthy');

    const ts = await analyticsApi.getTrustSafetyAnalytics();
    expect(ts.total_reports_count).toBeGreaterThan(0);
  });

  it('fetches mentorship, learning, activation funnel, cohort grid, and feature adoption data', async () => {
    const mentorship = await analyticsApi.getMentorshipAnalytics();
    expect(mentorship.total_mentors_count).toBeGreaterThan(0);

    const learning = await analyticsApi.getLearningAnalytics();
    expect(learning.courses_enrolled_count).toBeGreaterThan(0);

    const funnel = await analyticsApi.getActivationFunnel();
    expect(funnel.stages.length).toBeGreaterThan(0);

    const cohortGrid = await analyticsApi.getCohortGrid();
    expect(cohortGrid.cohorts.length).toBeGreaterThan(0);

    const featureAdoption = await analyticsApi.getFeatureAdoption();
    expect(featureAdoption.length).toBeGreaterThan(0);
  });

  it('handles user consent preferences and retention cleanup trigger', async () => {
    const consent = await analyticsApi.getUserConsent();
    expect(consent.essential_telemetry).toBe(true);

    const updated = await analyticsApi.updateUserConsent({ optional_analytics: false });
    expect(updated.optional_analytics).toBe(false);

    const customReport = await analyticsApi.createCustomReport({
      title: 'Monthly SLA',
      report_type: 'performance',
      export_format: 'csv',
    });
    expect(customReport.title).toBe('Monthly SLA');

    const cleanupRes = await analyticsApi.triggerRetentionCleanup(60);
    expect(cleanupRes.deleted_records).toBeGreaterThan(0);
  });
});
