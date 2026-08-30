import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { applicationsApi } from '../features/applications/api';
import { ApplicationCard, getStatusChipProps } from '../components/applications/ApplicationCard';
import { ApplicationDetails } from '../components/applications/ApplicationDetails';
import { ApplicationTimeline } from '../components/applications/ApplicationTimeline';
import { ApplicationDashboard } from '../components/applications/ApplicationDashboard';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard/applications',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({ id: 'app-1' }),
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getAccessToken: () => 'mock-jwt-token',
}));

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'u1', email: 'candidate@kirmya.com', name: 'Candidate User' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
    authenticated: true,
    isAuthenticated: true,
    loading: false,
    permissions: [],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Job Applications & Candidate Pipeline Experience (Prompt 23/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppSummary = {
    id: 'app-101',
    job_id: 'job-501',
    job_title: 'Staff Backend Distributed Systems Engineer',
    company_id: 'comp-10',
    company_name: 'Kirmya Global Cloud',
    company_logo: '',
    location: 'Dubai, UAE (Hybrid)',
    employment_type: 'Full-time',
    salary_range: 'AED 35,000 - 45,000 / month',
    current_status: 'Interview' as const,
    applied_at: '2026-08-28T10:00:00Z',
    last_update: '2026-08-30T10:00:00Z',
    is_saved: true,
    notes_count: 1,
  };

  const mockAppDetail = {
    summary: {
      ...mockAppSummary,
      status_explanation: 'Your technical interview with the hiring manager has been scheduled.',
      recruiter_name: 'Amira Tariq',
      recruiter_email: 'amira@kirmya.com',
    },
    job_description: 'Architect and scale multi-tenant microservices in Golang and Kubernetes.',
    requirements: ['5+ years Go experience', 'PostgreSQL performance tuning'],
    skills: ['Golang', 'Kubernetes', 'PostgreSQL'],
    timeline: [
      {
        id: 't-1',
        status: 'Applied',
        title: 'Application Submitted',
        description: 'Applied with Primary Resume.',
        date: '2026-08-28T10:00:00Z',
        moved_by: 'Candidate',
      },
      {
        id: 't-2',
        status: 'Interview',
        title: 'Technical Screen Scheduled',
        description: 'Scheduled with Amira Tariq for system design review.',
        date: '2026-08-30T10:00:00Z',
        moved_by: 'Amira Tariq',
      },
    ],
    submitted_resume: {
      id: 'doc-1',
      candidate_id: 'u1',
      title: 'Senior_Go_Resume_2026.pdf',
      document_type: 'resume',
      file_url: 'https://cdn.kirmya.com/docs/resume.pdf',
      size_bytes: 245000,
      file_type: 'pdf',
      is_default: true,
      uploaded_at: '2026-08-20T10:00:00Z',
    },
    submitted_cover_letter: {
      id: 'doc-2',
      candidate_id: 'u1',
      title: 'Cover_Letter_Kirmya.pdf',
      document_type: 'cover_letter',
      file_url: 'https://cdn.kirmya.com/docs/cover.pdf',
      size_bytes: 120000,
      file_type: 'pdf',
      is_default: false,
      uploaded_at: '2026-08-28T10:00:00Z',
    },
    notes: [],
    interviews: [
      {
        id: 'iv-1',
        application_id: 'app-101',
        job_title: 'Staff Backend Distributed Systems Engineer',
        company_name: 'Kirmya Global Cloud',
        company_logo: '',
        title: 'System Design & Distributed Concurrency',
        status: 'Scheduled',
        scheduled_start: '2026-09-02T14:00:00Z',
        scheduled_end: '2026-09-02T15:00:00Z',
        location_type: 'video',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        notes: 'Review Raft consensus and PostgreSQL sharding.',
        interviewer: 'Amira Tariq',
      },
    ],
  };

  describe('Status Normalization Helper', () => {
    it('returns appropriate chips for all supported backend stages', () => {
      expect(getStatusChipProps('Applied').label).toBe('Applied');
      expect(getStatusChipProps('Viewed').label).toBe('Under Review');
      expect(getStatusChipProps('Shortlisted').label).toBe('Shortlisted');
      expect(getStatusChipProps('Interview').label).toBe('Interview Scheduled');
      expect(getStatusChipProps('Offer').label).toBe('Job Offer Received');
      expect(getStatusChipProps('Accepted').label).toBe('Offer Accepted');
      expect(getStatusChipProps('Rejected').label).toBe('Not Selected');
      expect(getStatusChipProps('Withdrawn').label).toBe('Withdrawn');
    });
  });

  describe('ApplicationCard Component', () => {
    it('renders job title, company name, location, salary, and status badge', () => {
      renderWithTheme(<ApplicationCard application={mockAppSummary} />);

      expect(screen.getByText('Staff Backend Distributed Systems Engineer')).toBeDefined();
      expect(screen.getByText('Kirmya Global Cloud')).toBeDefined();
      expect(screen.getByText('Dubai, UAE (Hybrid)')).toBeDefined();
      expect(screen.getByText('AED 35,000 - 45,000 / month')).toBeDefined();
      expect(screen.getByText('Interview Scheduled')).toBeDefined();
      expect(screen.getByRole('link', { name: /Track Status/i })).toBeDefined();
    });
  });

  describe('ApplicationTimeline Component', () => {
    it('renders timeline title, events, and timestamps', () => {
      renderWithTheme(<ApplicationTimeline items={mockAppDetail.timeline} />);

      expect(screen.getByText('Application Activity & History')).toBeDefined();
      expect(screen.getByText('Application Submitted')).toBeDefined();
      expect(screen.getByText('Technical Screen Scheduled')).toBeDefined();
      expect(screen.getByText(/Updated by Amira Tariq/i)).toBeDefined();
    });
  });

  describe('ApplicationDetails Component', () => {
    it('renders full application details with status explanation, stepper, documents, and interview', () => {
      renderWithTheme(<ApplicationDetails application={mockAppDetail} />);

      expect(screen.getByText('Staff Backend Distributed Systems Engineer')).toBeDefined();
      expect(screen.getByText('Kirmya Global Cloud')).toBeDefined();
      expect(screen.getByText(/Your technical interview with the hiring manager has been scheduled/i)).toBeDefined();
      expect(screen.getByText('Senior_Go_Resume_2026.pdf')).toBeDefined();
      expect(screen.getByText('Cover_Letter_Kirmya.pdf')).toBeDefined();
      expect(screen.getByText('System Design & Distributed Concurrency')).toBeDefined();
      expect(screen.getByText('Amira Tariq')).toBeDefined();
      expect(screen.getByRole('button', { name: /Withdraw/i })).toBeDefined();
    });

    it('opens withdrawal dialog and triggers onWithdraw callback', () => {
      const mockWithdraw = vi.fn();
      renderWithTheme(<ApplicationDetails application={mockAppDetail} onWithdraw={mockWithdraw} />);

      const withdrawBtn = screen.getByRole('button', { name: /Withdraw/i });
      fireEvent.click(withdrawBtn);

      expect(screen.getByText(/Are you sure you want to withdraw your application/i)).toBeDefined();

      const confirmBtn = screen.getByRole('button', { name: /Confirm Withdrawal/i });
      fireEvent.click(confirmBtn);

      expect(mockWithdraw).toHaveBeenCalledTimes(1);
    });
  });

  describe('ApplicationDashboard Component', () => {
    const mockList = [
      mockAppSummary,
      {
        ...mockAppSummary,
        id: 'app-102',
        job_title: 'Principal Cloud Architect',
        current_status: 'Offer' as const,
      },
    ];

    it('renders metric cards, search bar, and filtered application cards', () => {
      renderWithTheme(<ApplicationDashboard applications={mockList} />);

      expect(screen.getByText('Applications & Pipeline Tracker')).toBeDefined();
      expect(screen.getByText('Total Submissions')).toBeDefined();
      expect(screen.getByText('Staff Backend Distributed Systems Engineer')).toBeDefined();
      expect(screen.getByText('Principal Cloud Architect')).toBeDefined();
    });
  });

  describe('applicationsApi Service', () => {
    it('getApplications calls GET /applications with query params', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({ data: [mockAppSummary] });

      const res = await applicationsApi.getApplications({ status: 'Interview' });
      expect(authApiClient.get).toHaveBeenCalledWith('/applications', {
        params: { status: 'Interview' },
      });
      expect(res).toEqual([mockAppSummary]);
    });

    it('getApplicationByID calls GET /applications/:id', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({ data: mockAppDetail });

      const res = await applicationsApi.getApplicationByID('app-101');
      expect(authApiClient.get).toHaveBeenCalledWith('/applications/app-101');
      expect(res.summary.job_title).toBe('Staff Backend Distributed Systems Engineer');
    });

    it('applyToJob calls POST /applications with payload', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: mockAppDetail });

      const res = await applicationsApi.applyToJob({ job_id: 'job-501', resume_id: 'doc-1' });
      expect(authApiClient.post).toHaveBeenCalledWith('/applications', {
        job_id: 'job-501',
        resume_id: 'doc-1',
      });
      expect(res).toEqual(mockAppDetail);
    });

    it('withdrawApplication calls PUT /applications/:id/withdraw', async () => {
      (authApiClient.put as any).mockResolvedValueOnce({ data: { message: 'withdrawn' } });

      const res = await applicationsApi.withdrawApplication('app-101');
      expect(authApiClient.put).toHaveBeenCalledWith('/applications/app-101/withdraw');
      expect(res.message).toBe('withdrawn');
    });
  });
});
