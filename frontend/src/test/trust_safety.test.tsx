import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafetyCenter from '../components/safety/SafetyCenter';
import SafetyGuidelines from '../components/safety/SafetyGuidelines';
import ReportDialog from '../components/safety/ReportDialog';
import BlockList from '../components/safety/BlockList';
import AppealForm from '../components/safety/AppealForm';
import ModerationDashboard from '../components/safety/ModerationDashboard';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/safety',
}));

const theme = createTheme();

describe('Trust & Safety Subsystem Tests', () => {
  it('renders Safety Center hub', () => {
    render(
      <ThemeProvider theme={theme}>
        <SafetyCenter />
      </ThemeProvider>
    );
    expect(screen.getByText(/Kirmya Safety & Trust Operations Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Community Guidelines/i)).toBeInTheDocument();
  });

  it('renders Safety Guidelines', () => {
    render(
      <ThemeProvider theme={theme}>
        <SafetyGuidelines />
      </ThemeProvider>
    );
    expect(screen.getByText(/Community & Safety Guidelines/i)).toBeInTheDocument();
    expect(screen.getByText(/Job Scams & Financial Fraud/i)).toBeInTheDocument();
  });

  it('renders Report Dialog modal', () => {
    render(
      <ThemeProvider theme={theme}>
        <ReportDialog open={true} onClose={() => {}} />
      </ThemeProvider>
    );
    expect(screen.getByText(/Report Content or Account/i)).toBeInTheDocument();
  });

  it('renders Block List component', () => {
    render(
      <ThemeProvider theme={theme}>
        <BlockList />
      </ThemeProvider>
    );
    expect(screen.getByText(/Blocked Accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/Apex Recruiters Agency/i)).toBeInTheDocument();
  });

  it('renders Appeal Form', () => {
    render(
      <ThemeProvider theme={theme}>
        <AppealForm />
      </ThemeProvider>
    );
    expect(screen.getByText(/Submit Enforcement Appeal/i)).toBeInTheDocument();
  });

  it('renders Admin Moderation Dashboard', () => {
    render(
      <ThemeProvider theme={theme}>
        <ModerationDashboard />
      </ThemeProvider>
    );
    expect(screen.getByText(/Trust & Safety Moderation Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Reports Today/i)).toBeInTheDocument();
  });
});
