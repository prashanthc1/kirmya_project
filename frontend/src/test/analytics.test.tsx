import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsCard from '../components/analytics/AnalyticsCard';
import AnalyticsChart from '../components/analytics/AnalyticsChart';
import AnalyticsFilters from '../components/analytics/AnalyticsFilters';
import FunnelChart from '../components/analytics/FunnelChart';
import CohortTable from '../components/analytics/CohortTable';
import ProfileAnalytics from '../components/analytics/ProfileAnalytics';
import RecruiterAnalytics from '../components/analytics/RecruiterAnalytics';
import CompanyAnalytics from '../components/analytics/CompanyAnalytics';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/analytics',
}));

const theme = createTheme();

describe('Analytics & Product Intelligence Subsystem Tests', () => {
  it('renders AnalyticsCard metric summary', () => {
    render(
      <ThemeProvider theme={theme}>
        <AnalyticsCard title="Total Platform Users" value="12,450" change="+14.5%" />
      </ThemeProvider>
    );
    expect(screen.getByText(/Total Platform Users/i)).toBeInTheDocument();
    expect(screen.getByText(/12,450/i)).toBeInTheDocument();
  });

  it('renders AnalyticsChart trend container', () => {
    const chartData = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ];
    render(
      <ThemeProvider theme={theme}>
        <AnalyticsChart title="User Growth" data={chartData} />
      </ThemeProvider>
    );
    expect(screen.getByText(/User Growth/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan/i)).toBeInTheDocument();
  });

  it('renders AnalyticsFilters toolbar', () => {
    render(
      <ThemeProvider theme={theme}>
        <AnalyticsFilters dateRange="30D" onDateRangeChange={() => {}} />
      </ThemeProvider>
    );
    expect(screen.getByText(/30D/i)).toBeInTheDocument();
    expect(screen.getByText(/7D/i)).toBeInTheDocument();
  });

  it('renders FunnelChart pipeline', () => {
    const stages = [{ stage: 'Applied', count: 100, percentage: 100 }];
    render(
      <ThemeProvider theme={theme}>
        <FunnelChart title="Candidate Funnel" stages={stages} />
      </ThemeProvider>
    );
    expect(screen.getByText(/Candidate Funnel/i)).toBeInTheDocument();
    expect(screen.getByText(/Applied/i)).toBeInTheDocument();
  });

  it('renders CohortTable retention matrix', () => {
    render(
      <ThemeProvider theme={theme}>
        <CohortTable />
      </ThemeProvider>
    );
    expect(screen.getByText(/User Retention Cohorts/i)).toBeInTheDocument();
  });

  it('renders User Profile Analytics', () => {
    render(
      <ThemeProvider theme={theme}>
        <ProfileAnalytics />
      </ThemeProvider>
    );
    expect(screen.getByText(/Personal Career & Profile Analytics/i)).toBeInTheDocument();
  });

  it('renders Recruiter Analytics workspace', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecruiterAnalytics />
      </ThemeProvider>
    );
    expect(screen.getByText(/Recruiter & Talent Acquisition Intelligence/i)).toBeInTheDocument();
  });

  it('renders Company Analytics hub', () => {
    render(
      <ThemeProvider theme={theme}>
        <CompanyAnalytics />
      </ThemeProvider>
    );
    expect(screen.getByText(/Company Employer Brand Analytics/i)).toBeInTheDocument();
  });

  it('renders Admin Analytics Dashboard', () => {
    render(
      <ThemeProvider theme={theme}>
        <AnalyticsDashboard />
      </ThemeProvider>
    );
    expect(screen.getByText(/Platform Product Intelligence & Executive Dashboard/i)).toBeInTheDocument();
  });
});
