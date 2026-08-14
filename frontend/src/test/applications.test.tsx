import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CandidateJobDashboard } from '../components/applications/CandidateJobDashboard';
import { ApplicationDashboard } from '../components/applications/ApplicationDashboard';
import { ApplicationCard } from '../components/applications/ApplicationCard';
import { ApplicationDetails } from '../components/applications/ApplicationDetails';
import { ApplicationTimeline } from '../components/applications/ApplicationTimeline';
import { SavedJobs } from '../components/applications/SavedJobs';
import { JobAlertManager } from '../components/applications/JobAlertManager';
import { InterviewDashboard } from '../components/applications/InterviewDashboard';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/applications',
}));

const theme = createTheme();

describe('Candidate Experience & Application Tracking Suite', () => {
  it('renders CandidateJobDashboard component', () => {
    render(
      <ThemeProvider theme={theme}>
        <CandidateJobDashboard />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Job Dashboard|Overview|Recommended/i).length).toBeGreaterThan(0);
  });

  it('renders ApplicationDashboard component', () => {
    render(
      <ThemeProvider theme={theme}>
        <ApplicationDashboard applications={[]} />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Applications|Status|Tracker/i).length).toBeGreaterThan(0);
  });

  it('renders ApplicationCard component', () => {
    const mockApp = {
      id: '10000000-0000-0000-0000-000000000001',
      job_id: 'job-1',
      job_title: 'Staff Frontend Engineer',
      company_id: 'comp-1',
      company_name: 'Kirmya AI Technologies',
      company_logo: '/images/companies/kirmya.png',
      location: 'San Francisco, CA',
      employment_type: 'Full-time',
      salary_range: '$160k - $200k',
      current_status: 'Interview' as const,
      applied_at: new Date().toISOString(),
      last_update: new Date().toISOString(),
      is_saved: true,
      notes_count: 2,
    };
    render(
      <ThemeProvider theme={theme}>
        <ApplicationCard application={mockApp} onViewDetails={vi.fn()} />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Staff Frontend Engineer/i)[0]).toBeInTheDocument();
  });

  it('renders ApplicationTimeline component', () => {
    const items = [
      { id: '1', status: 'Applied', title: 'Submitted', description: 'App submitted', date: new Date().toISOString(), moved_by: 'Candidate' },
    ];
    render(
      <ThemeProvider theme={theme}>
        <ApplicationTimeline items={items} />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Submitted/i).length).toBeGreaterThan(0);
  });

  it('renders SavedJobs component', () => {
    render(
      <ThemeProvider theme={theme}>
        <SavedJobs jobs={[]} />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Saved/i).length).toBeGreaterThan(0);
  });

  it('renders JobAlertManager component', () => {
    render(
      <ThemeProvider theme={theme}>
        <JobAlertManager alerts={[]} onCreateAlert={vi.fn()} onDeleteAlert={vi.fn()} />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Alert/i).length).toBeGreaterThan(0);
  });

  it('renders InterviewDashboard component', () => {
    render(
      <ThemeProvider theme={theme}>
        <InterviewDashboard interviews={[]} />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Interview/i).length).toBeGreaterThan(0);
  });
});
