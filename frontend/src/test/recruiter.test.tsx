import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardCards from '../components/recruiter/DashboardCards';
import RecruiterOnboarding from '../components/recruiter/RecruiterOnboarding';
import AIRecruiterAssistant from '../components/recruiter/AIRecruiterAssistant';
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme();

describe('Recruiter Subsystem Component Tests', () => {
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
});
