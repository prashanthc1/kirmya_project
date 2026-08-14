import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardCards from '../components/recruiter/DashboardCards';
import RecruiterOnboarding from '../components/recruiter/RecruiterOnboarding';
import AIRecruiterAssistant from '../components/recruiter/AIRecruiterAssistant';
import PipelineBoard from '../components/recruiter/PipelineBoard';
import RecruiterNotes from '../components/recruiter/RecruiterNotes';
import CandidateProfile from '../components/recruiter/CandidateProfile';
import ApplicationDetails from '../components/recruiter/ApplicationDetails';
import InterviewScheduler from '../components/recruiter/InterviewScheduler';
import OfferManager from '../components/recruiter/OfferManager';
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
    render(
      <ThemeProvider theme={theme}>
        <PipelineBoard />
      </ThemeProvider>
    );
    expect(screen.getByText(/Kanban/i)).toBeInTheDocument();
  });

  it('renders RecruiterNotes component', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecruiterNotes candidateId="c1111111-1111-1111-1111-111111111111" candidateName="Sarah Chen" />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Notes/i).length).toBeGreaterThan(0);
  });

  it('renders CandidateProfile component', () => {
    render(
      <ThemeProvider theme={theme}>
        <CandidateProfile candidateId="c1111111-1111-1111-1111-111111111111" />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Candidate/i).length).toBeGreaterThan(0);
  });

  it('renders ApplicationDetails component', () => {
    render(
      <ThemeProvider theme={theme}>
        <ApplicationDetails applicationId="a1111111-1111-1111-1111-111111111111" />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Application/i).length).toBeGreaterThan(0);
  });

  it('renders InterviewScheduler component', () => {
    render(
      <ThemeProvider theme={theme}>
        <InterviewScheduler />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Interview/i).length).toBeGreaterThan(0);
  });

  it('renders OfferManager component', () => {
    render(
      <ThemeProvider theme={theme}>
        <OfferManager />
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Offer/i).length).toBeGreaterThan(0);
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
