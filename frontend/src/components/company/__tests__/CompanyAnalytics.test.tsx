import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyAnalytics from '../CompanyAnalytics';
import AICompanyAssistant from '../AICompanyAssistant';
import { renderWithProviders } from '../../../test/utils';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getAnalytics: vi.fn(),
    getInsights: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const analytics = (overrides: Record<string, unknown> = {}) =>
  ({
    from: '2024-10-01T00:00:00Z',
    to: '2024-10-31T00:00:00Z',
    profileViews: 4820,
    uniqueVisitors: 3110,
    jobViews: 2400,
    applications: 120,
    applicationConversion: 0.05,
    followers: 1280,
    followerGrowth: 46,
    interviews: 30,
    interviewRate: 0.25,
    offers: 9,
    offerRate: 0.075,
    hires: 6,
    hireRate: 0.05,
    candidateSources: { search: 70, referral: 50 },
    recruiterActivity: [],
    series: [
      { date: '2024-10-01', profileViews: 100, jobViews: 60, applications: 4, followers: 2 },
      { date: '2024-10-02', profileViews: 140, jobViews: 80, applications: 6, followers: 1 },
    ],
    ...overrides,
  }) as never;

describe('CompanyAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the counts the server aggregated', async () => {
    api.getAnalytics.mockResolvedValue(analytics());

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    expect(await screen.findByText('4,820')).toBeInTheDocument();
    expect(screen.getByText('3,110')).toBeInTheDocument();
    expect(screen.getByText('2,400')).toBeInTheDocument();
    // 120 applications is both a headline figure and the top of the funnel.
    expect(screen.getAllByText('120').length).toBeGreaterThan(0);
  });

  // A rate is only meaningful next to the counts it came from. Both the
  // percentage and the two numbers behind it are on the same screen, so nothing
  // has to be taken on trust.
  it('shows every rate against the counts it was derived from', async () => {
    api.getAnalytics.mockResolvedValue(analytics());

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    expect(await screen.findByText('5.0% of job views')).toBeInTheDocument();
    expect(screen.getByText('Hires as a share of applications')).toBeInTheDocument();
    // Each funnel bar carries its rate as the bar's own accessible label.
    expect(screen.getByLabelText('25.0% of applications')).toBeInTheDocument();
    expect(screen.getByLabelText('7.5% of applications')).toBeInTheDocument();
    expect(screen.getByLabelText('5.0% of applications')).toBeInTheDocument();
  });

  it('reports follower growth with its sign', async () => {
    api.getAnalytics.mockResolvedValue(analytics({ followerGrowth: -12 }));

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    expect(await screen.findByText('-12 in this period')).toBeInTheDocument();
  });

  it('asks the server for the selected range instead of slicing what it has', async () => {
    const user = userEvent.setup();
    api.getAnalytics.mockResolvedValue(analytics());

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);
    await screen.findByText('4,820');

    const before = api.getAnalytics.mock.calls.length;
    await user.click(screen.getByRole('button', { name: '7 days' }));

    await waitFor(() => expect(api.getAnalytics.mock.calls.length).toBeGreaterThan(before));
    const [, range] = api.getAnalytics.mock.calls.at(-1) as [string, { from: string; to: string }];
    const days = Math.round(
      (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86_400_000
    );
    expect(days).toBe(7);
  });

  it('names the period the figures cover', async () => {
    api.getAnalytics.mockResolvedValue(analytics());

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    expect(
      await screen.findByText('2024-10-01 to 2024-10-31, one point per day.')
    ).toBeInTheDocument();
  });

  it('says a source was not recorded rather than attributing it', async () => {
    api.getAnalytics.mockResolvedValue(analytics({ candidateSources: {} }));

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    expect(
      await screen.findByText('No source was recorded for applications in this period.')
    ).toBeInTheDocument();
  });

  it('says no recruiter acted rather than showing an empty table', async () => {
    api.getAnalytics.mockResolvedValue(analytics({ recruiterActivity: [] }));

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    expect(
      await screen.findByText('No recruiter actions were recorded in this period.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('attributes recruiter activity to the recruiter who did it', async () => {
    api.getAnalytics.mockResolvedValue(
      analytics({
        recruiterActivity: [
          {
            userId: 'user-5',
            name: 'Ravi Menon',
            jobsPosted: 4,
            applicationsReviewed: 88,
            interviews: 12,
            hires: 3,
          },
        ],
      })
    );

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    const table = await screen.findByRole('table', {
      name: 'Recruiter activity in the selected period',
    });
    const row = within(table).getByRole('row', { name: /Ravi Menon/ });
    expect(within(row).getByText('88')).toBeInTheDocument();
    expect(within(row).getByText('3')).toBeInTheDocument();
  });

  it('reports a failed load', async () => {
    api.getAnalytics.mockRejectedValue(new Error('Analytics could not be loaded.'));

    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Analytics could not be loaded.');
  });
});

const insights = (overrides: Record<string, unknown> = {}) =>
  ({
    from: '2024-08-01T00:00:00Z',
    to: '2024-10-31T00:00:00Z',
    summary: '120 applications across 6 published jobs in this period.',
    suggestedSkills: [],
    insights: [],
    ...overrides,
  }) as never;

describe('AICompanyAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The assistant is measurement, not prose. It says as much on the panel, and
  // every observation carries the figures it came from.
  it('states that nothing on the panel is generated text', async () => {
    api.getInsights.mockResolvedValue(insights());

    renderWithProviders(<AICompanyAssistant companyId="company-1" />);

    expect(
      await screen.findByText(
        /These are measurements of your own data, not generated text\. Nothing here describes your culture, quotes a review, or predicts a result\./
      )
    ).toBeInTheDocument();
  });

  it('shows the evidence behind each observation', async () => {
    api.getInsights.mockResolvedValue(
      insights({
        insights: [
          {
            id: 'insight-1',
            severity: 'warning',
            category: 'Hiring',
            title: 'Applications are not being reviewed',
            detail: '64 of 120 applications have had no decision recorded.',
            evidence: ['120 applications', '64 without a decision'],
            actions: ['Assign a reviewer to the open pipelines'],
          },
        ],
      })
    );

    renderWithProviders(<AICompanyAssistant companyId="company-1" />);

    expect(await screen.findByText('Applications are not being reviewed')).toBeInTheDocument();
    expect(screen.getByText('Based on')).toBeInTheDocument();
    expect(screen.getByText('120 applications')).toBeInTheDocument();
    expect(screen.getByText('64 without a decision')).toBeInTheDocument();
    expect(screen.getByText('Assign a reviewer to the open pipelines')).toBeInTheDocument();
  });

  // With nothing recorded it says so. Filling the space would mean inventing an
  // observation the data does not support.
  it('says there is nothing to observe rather than producing something', async () => {
    api.getInsights.mockResolvedValue(insights({ insights: [] }));

    renderWithProviders(<AICompanyAssistant companyId="company-1" />);

    expect(
      await screen.findByText(
        'There is not enough recorded activity in this period to observe anything.'
      )
    ).toBeInTheDocument();
  });

  it('omits the skills panel when no applicant skills were recorded', async () => {
    api.getInsights.mockResolvedValue(insights({ suggestedSkills: [] }));

    renderWithProviders(<AICompanyAssistant companyId="company-1" />);

    await screen.findByText(/These are measurements of your own data/);
    expect(screen.queryByText('Skills appearing in your applicants')).not.toBeInTheDocument();
  });

  it('attributes applicant skills to the applicants they came from', async () => {
    api.getInsights.mockResolvedValue(insights({ suggestedSkills: ['Forklift', 'Cold chain'] }));

    renderWithProviders(<AICompanyAssistant companyId="company-1" />);

    expect(await screen.findByText('Skills appearing in your applicants')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Taken from the profiles of people who applied to this company's jobs in this period."
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Forklift')).toBeInTheDocument();
  });

  it('asks the server for the selected period', async () => {
    const user = userEvent.setup();
    api.getInsights.mockResolvedValue(insights());

    renderWithProviders(<AICompanyAssistant companyId="company-1" />);
    await screen.findByText(/These are measurements of your own data/);

    const before = api.getInsights.mock.calls.length;
    await user.click(screen.getByRole('button', { name: '180 days' }));

    await waitFor(() => expect(api.getInsights.mock.calls.length).toBeGreaterThan(before));
    const [, range] = api.getInsights.mock.calls.at(-1) as [string, { from: string; to: string }];
    const days = Math.round(
      (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86_400_000
    );
    expect(days).toBe(180);
  });
});
