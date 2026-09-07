import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { ApplyJobModal } from '../components/applications/ApplyJobModal';
import { authApiClient } from '../services/authService';

vi.mock('../services/authService', () => ({
  authApiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getAccessToken: () => 'mock-jwt-token',
}));

vi.mock('../context/AuthContext', () => {
  // The modal effect depends on the user object. Match the provider contract
  // by returning one stable context value instead of allocating a user on
  // every render, which would intentionally retrigger the effect forever.
  const context = {
    user: { id: 'u1', email: 'candidate@kirmya.com', name: 'Candidate User' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
    authenticated: true,
    isAuthenticated: true,
    loading: false,
    permissions: [],
  };
  return { useAuthContext: () => context };
});

const theme = getTheme('light');

describe('ApplyJobModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('steps through the application workflow and submits it', async () => {
    (authApiClient.get as any).mockResolvedValueOnce({
      data: [{
        id: 'doc-1', candidate_id: 'u1', title: 'Senior_Go_Resume.pdf', document_type: 'Resume',
        file_url: 'https://cdn.kirmya.com/resume.pdf', size_bytes: 200000, file_type: 'pdf',
        is_default: true, uploaded_at: '2026-08-20T10:00:00Z',
      }],
    });
    const handleSuccess = vi.fn();
    render(<ThemeProvider theme={theme}><ApplyJobModal
      open
      job={{
        id: 'job-501', title: 'Staff Backend Distributed Systems Engineer',
        company_name: 'Kirmya Global Cloud', company_id: 'comp-10', location: 'Dubai, UAE (Hybrid)',
        employment_type: 'Full-time', work_mode: 'hybrid', salary_range: 'AED 35,000 - 45,000 / month',
        screening_questions: [{ id: 'sq-1', question: 'How many years of production Go experience do you have?' }],
        description: 'Test job description', status: 'active', created_at: '2026-08-20T10:00:00Z',
      } as any}
      onClose={vi.fn()}
      onSuccess={handleSuccess}
    /></ThemeProvider>);

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    for (const expected of [
      /Select a tailored resume/i,
      /Add a personalized note/i,
      /How many years of production Go experience do you have/i,
      /Please review your application summary/i,
    ]) {
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
      await waitFor(() => expect(screen.getByText(expected)).toBeDefined());
    }

    (authApiClient.post as any).mockResolvedValueOnce({ data: { summary: { id: 'app-999' } } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
    await waitFor(() => {
      expect(authApiClient.post).toHaveBeenCalledWith('/applications', expect.objectContaining({ job_id: 'job-501' }));
      expect(handleSuccess).toHaveBeenCalledWith('app-999');
    });
  });
});
