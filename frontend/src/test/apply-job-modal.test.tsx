import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { ApplyJobModal } from '../components/applications/ApplyJobModal';
import { authApiClient } from '../services/authService';

vi.mock('../services/authService', () => ({
  API_BASE_URL: 'http://127.0.0.1:8080/api/v1',
  extractApiError: (err: any, fallback = 'error') => ({
    message: err?.response?.data?.error || err?.message || fallback,
  }),
  authApiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getAccessToken: () => 'mock-jwt-token',
}));

vi.mock('../hooks/useAuth', () => {
  const value = {
    user: {
      id: 'u1',
      email: 'candidate@kirmya.com',
      firstName: 'Candidate',
      lastName: 'User',
      name: 'Candidate User',
    },
    authenticated: true,
    isAuthenticated: true,
    status: 'authenticated' as const,
    loading: false,
    notificationsCount: 0,
    permissions: [],
    workspaces: [],
    logout: vi.fn(),
  };
  return { useAuth: () => value, default: () => value };
});

const theme = getTheme('light');

const resumeDoc = {
  id: 'doc-1',
  candidate_id: 'u1',
  title: 'Senior_Go_Resume.pdf',
  document_type: 'Resume',
  file_url: 'https://cdn.kirmya.com/resume.pdf',
  size_bytes: 200000,
  file_type: 'pdf',
  is_default: true,
  uploaded_at: '2026-08-20T10:00:00Z',
};

const baseJob = {
  id: 'job-501',
  title: 'Staff Backend Distributed Systems Engineer',
  company_name: 'Kirmya Global Cloud',
  company_id: 'comp-10',
  location: 'Dubai, UAE (Hybrid)',
  employment_type: 'Full-time',
  work_mode: 'hybrid',
  salary_range: 'AED 35,000 - 45,000 / month',
  description: 'Test job description',
  status: 'active',
  created_at: '2026-08-20T10:00:00Z',
};

describe('ApplyJobModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('steps through the application workflow and submits it', async () => {
    (authApiClient.get as any).mockResolvedValueOnce({ data: [resumeDoc] });
    const handleSuccess = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <ApplyJobModal
          open
          job={{
            ...baseJob,
            screening_questions: [
              { id: 'sq-1', question: 'How many years of production Go experience do you have?' },
            ],
          } as any}
          onClose={vi.fn()}
          onSuccess={handleSuccess}
        />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    // Wait for resumes to load before leaving the contact step so the resume
    // gate cannot race with the document fetch.
    await waitFor(() => expect(authApiClient.get).toHaveBeenCalled());

    for (const expected of [
      /Select a tailored resume|Senior_Go_Resume|Your Documents/i,
      /Add a personalized note|Cover Note/i,
      /How many years of production Go experience do you have/i,
      /Please review your application summary|Review/i,
    ]) {
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
      await waitFor(() => expect(screen.getByText(expected)).toBeDefined());
    }

    (authApiClient.post as any).mockResolvedValueOnce({ data: { summary: { id: 'app-999' } } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
    await waitFor(() => {
      expect(authApiClient.post).toHaveBeenCalledWith(
        '/applications',
        expect.objectContaining({ job_id: 'job-501' }),
      );
      expect(handleSuccess).toHaveBeenCalledWith('app-999');
    });
  });

  it('blocks progression on step 0 if email is empty', async () => {
    (authApiClient.get as any).mockResolvedValueOnce({ data: [] });
    render(
      <ThemeProvider theme={theme}>
        <ApplyJobModal
          open
          job={{ id: 'job-502', title: 'Frontend Engineer', company_name: 'Kirmya Global' } as any}
          onClose={vi.fn()}
        />
      </ThemeProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => {
      expect(screen.getByText(/Please provide a valid email address/i)).toBeDefined();
    });
  });

  it('blocks progression when no resume is selected', async () => {
    (authApiClient.get as any).mockResolvedValueOnce({ data: [] });
    render(
      <ThemeProvider theme={theme}>
        <ApplyJobModal
          open
          job={{ id: 'job-504', title: 'QA Engineer', company_name: 'Kirmya Global' } as any}
          onClose={vi.fn()}
        />
      </ThemeProvider>
    );

    await waitFor(() => expect(authApiClient.get).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() =>
      expect(screen.getByText(/Select a tailored resume|Your Documents|resume/i)).toBeDefined(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => {
      expect(screen.getByText(/Please select a resume or provide a document link/i)).toBeDefined();
    });
  });

  it('handles API submission errors gracefully and displays error alert', async () => {
    (authApiClient.get as any).mockResolvedValueOnce({ data: [resumeDoc] });
    (authApiClient.post as any).mockRejectedValueOnce({
      response: { data: { message: 'Candidate already applied to this job' } },
    });

    render(
      <ThemeProvider theme={theme}>
        <ApplyJobModal
          open
          job={{
            id: 'job-503',
            title: 'DevOps Engineer',
            company_name: 'Kirmya Global',
            screening_questions: [],
          } as any}
          onClose={vi.fn()}
        />
      </ThemeProvider>
    );

    await waitFor(() => expect(authApiClient.get).toHaveBeenCalled());

    for (const expected of [
      /Select a tailored resume|Senior_Go_Resume|Your Documents/i,
      /Add a personalized note|Cover Note/i,
      /screening|No screening|Review|application summary/i,
      /Please review your application summary|Review/i,
    ]) {
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
      await waitFor(() => expect(screen.getByText(expected)).toBeDefined());
    }

    fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
    await waitFor(() => {
      expect(screen.getByText(/Candidate already applied to this job/i)).toBeDefined();
    });
  });
});
