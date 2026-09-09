import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardCards from '../components/recruiter/DashboardCards';
import RecruiterOnboarding from '../components/recruiter/RecruiterOnboarding';
import AIRecruiterAssistant from '../components/recruiter/AIRecruiterAssistant';
import PipelineBoard from '../components/recruiter/PipelineBoard';
import RecruiterNotes from '../components/recruiter/RecruiterNotes';
import CandidateProfile from '../components/recruiter/CandidateProfile';
import ApplicationDetails from '../components/recruiter/ApplicationDetails';
import InterviewScheduler from '../components/recruiter/InterviewScheduler';
import JobManager from '../components/recruiter/JobManager';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/recruiter',
}));

const theme = createTheme();

describe('Recruiter ATS Production Test Suite', () => {
  it('renders Recruiter Onboarding stepper and steps', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecruiterOnboarding />
      </ThemeProvider>
    );
    expect(screen.getByText(/Recruiter & Employer Onboarding/i)).toBeInTheDocument();
    expect(screen.getByText(/Company Details/i)).toBeInTheDocument();
  });

  it('renders Dashboard Overview Metrics Cards', () => {
    const mockOverview = {
      activeJobsCount: 5,
      draftJobsCount: 2,
      totalApplicantsCount: 142,
      newCandidatesCount: 18,
      shortlistedCount: 9,
      interviewsScheduled: 6,
      offersCount: 3,
      successfulHiresCount: 12,
      expiringJobsCount: 1,
    };

    render(
      <ThemeProvider theme={theme}>
        <DashboardCards overview={mockOverview} />
      </ThemeProvider>
    );

    expect(screen.getByText(/Active Jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/Draft Jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/New Candidates/i)).toBeInTheDocument();
  });

  it('renders AI Recruiting Assistant capabilities', () => {
    render(
      <ThemeProvider theme={theme}>
        <AIRecruiterAssistant />
      </ThemeProvider>
    );
    expect(screen.getByText(/AI Recruiting Assistant & Co-Pilot/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Interview Questions/i)).toBeInTheDocument();
  });

  it('renders PipelineBoard with stage columns', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <PipelineBoard />
      </ThemeProvider>
      </QueryClientProvider>
    );
    // With no job selected the board says so rather than inventing a pipeline.
    expect(screen.getByText(/Choose a job posting/i)).toBeInTheDocument();
  });

  /*
   * These four read from the API now, so with the network disabled they render
   * a stated failure. They used to render invented people held in component
   * state - which is exactly why "renders" was all these assertions could
   * check, and why they passed while the screens were fiction.
   */
  const withQuery = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </QueryClientProvider>
    );
  };

  it('RecruiterNotes says its notes could not be read rather than inventing two', async () => {
    withQuery(
      <RecruiterNotes candidateId="c1111111-1111-1111-1111-111111111111" candidateName="A Candidate" />
    );
    await waitFor(() => {
      expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Rashid Al-Maktoum/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Amira Al-Farsi/i)).not.toBeInTheDocument();
  });

  it('CandidateProfile says the candidate could not be read rather than showing a fixed one', async () => {
    withQuery(<CandidateProfile candidateId="c1111111-1111-1111-1111-111111111111" />);
    await waitFor(() => {
      expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/96% MATCH/i)).not.toBeInTheDocument();
  });

  it('ApplicationDetails says the application could not be read rather than showing a fixed one', async () => {
    withQuery(<ApplicationDetails applicationId="a1111111-1111-1111-1111-111111111111" />);
    await waitFor(() => {
      expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
    });
  });

  it('InterviewScheduler says its interviews could not be read rather than listing one', async () => {
    withQuery(<InterviewScheduler />);
    await waitFor(() => {
      expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/meet\.google\.com/i)).not.toBeInTheDocument();
  });

  it('renders JobManager component', () => {
    render(
      <ThemeProvider theme={theme}>
        <JobManager />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Job/i).length).toBeGreaterThan(0);
  });
});
