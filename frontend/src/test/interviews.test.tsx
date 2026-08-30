import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { interviewApi } from '../features/interview/api';
import { InterviewDashboard } from '../components/applications/InterviewDashboard';
import { AvailabilityManager } from '../features/interview/components/AvailabilityManager';
import { CalendarView } from '../features/interview/components/CalendarView';
import { RemindersPanel } from '../features/interview/components/RemindersPanel';
import { FeedbackFormModal } from '../features/interview/components/FeedbackFormModal';
import { ScheduleModal } from '../features/interview/components/ScheduleModal';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/interviews',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({ id: 'iv-1' }),
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

describe('Interview & Scheduling Experience (Prompt 24/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCandidateInterviews = [
    {
      id: 'iv-101',
      application_id: 'app-501',
      job_title: 'Principal Distributed Systems Engineer',
      company_name: 'Kirmya Global Cloud',
      company_logo: '',
      title: 'Round 1: System Design & Concurrency',
      status: 'scheduled',
      scheduled_start: '2026-09-02T14:00:00Z',
      scheduled_end: '2026-09-02T15:00:00Z',
      location_type: 'virtual',
      meeting_link: 'https://meet.google.com/xyz-abcd-efg',
      notes: 'Focus on distributed lock algorithms and PostgreSQL transaction isolation.',
      interviewer: 'Sarah Chen (Lead Tech)',
    },
    {
      id: 'iv-102',
      application_id: 'app-502',
      job_title: 'Staff Frontend Engineer',
      company_name: 'Kirmya AI Technologies',
      company_logo: '',
      title: 'Round 2: Architecture & Performance Review',
      status: 'completed',
      scheduled_start: '2026-08-25T11:00:00Z',
      scheduled_end: '2026-08-25T12:00:00Z',
      location_type: 'virtual',
      meeting_link: 'https://meet.google.com/qrs-tuvw-xyz',
      notes: 'Completed evaluation.',
      interviewer: 'Michael Scott',
    },
  ];

  const mockAvailability = [
    {
      id: 'avail-1',
      candidate_id: 'u1',
      start_time: '2026-09-03T10:00:00Z',
      end_time: '2026-09-03T12:00:00Z',
      status: 'available' as const,
      notes: 'Morning slot open for technical deep dives',
      created_at: '2026-08-30T10:00:00Z',
    },
  ];

  const mockReminders = [
    {
      interview_id: 'iv-101',
      title: 'Round 1: System Design & Concurrency',
      candidate_id: 'u1',
      scheduled_start: '2026-09-02T14:00:00Z',
      scheduled_end: '2026-09-02T15:00:00Z',
      meeting_link: 'https://meet.google.com/xyz-abcd-efg',
      minutes_remaining: 10,
      role: 'Candidate',
    },
  ];

  describe('InterviewDashboard Component', () => {
    it('renders upcoming interviews with company name, title, status, and join video link', () => {
      renderWithTheme(<InterviewDashboard interviews={mockCandidateInterviews} />);

      expect(screen.getByText('Interviews & Scheduling')).toBeDefined();
      expect(screen.getByText('Round 1: System Design & Concurrency')).toBeDefined();
      expect(screen.getByText(/Kirmya Global Cloud/i)).toBeDefined();
      expect(screen.getByRole('link', { name: /Join Video Call/i })).toBeDefined();
    });

    it('switches tabs between Upcoming and Past Rounds', () => {
      renderWithTheme(<InterviewDashboard interviews={mockCandidateInterviews} />);

      const pastTab = screen.getByRole('button', { name: /Past Rounds \(1\)/i });
      fireEvent.click(pastTab);

      expect(screen.getByText('Round 2: Architecture & Performance Review')).toBeDefined();
    });

    it('renders empty state when no interviews match filter', () => {
      renderWithTheme(<InterviewDashboard interviews={[]} />);

      expect(screen.getByText('No Upcoming Interviews')).toBeDefined();
      expect(screen.getByRole('link', { name: /View Active Applications/i })).toBeDefined();
    });
  });

  describe('AvailabilityManager Component', () => {
    it('renders candidate availability slots and saves new slot', async () => {
      const mockSave = vi.fn().mockResolvedValueOnce(undefined);
      renderWithTheme(
        <AvailabilityManager
          candidateId="u1"
          availabilityList={mockAvailability}
          onSaveAvailability={mockSave}
        />
      );

      expect(screen.getByText('Candidate Availability Manager')).toBeDefined();
      expect(screen.getByText(/Morning slot open for technical deep dives/i)).toBeDefined();

      const saveBtn = screen.getByRole('button', { name: /Save Availability Slot/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('CalendarView Component', () => {
    it('renders month/week view buttons and navigation controls', () => {
      renderWithTheme(
        <CalendarView interviews={mockCandidateInterviews as any} />
      );

      expect(screen.getByRole('button', { name: 'Month' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Week' })).toBeDefined();
      expect(screen.getByRole('button', { name: /Today/i })).toBeDefined();
    });
  });

  describe('RemindersPanel Component', () => {
    it('renders real-time countdown alerts and meeting action', () => {
      renderWithTheme(<RemindersPanel reminders={mockReminders} />);

      expect(screen.getByText('STARTS NOW / SOON')).toBeDefined();
      expect(screen.getByText('In 10 minutes')).toBeDefined();
      expect(screen.getByRole('link', { name: /Join Video Meeting/i })).toBeDefined();
    });
  });

  describe('FeedbackFormModal Component', () => {
    it('renders scorecard inputs and submits rating', async () => {
      const mockSubmit = vi.fn().mockResolvedValueOnce(undefined);
      renderWithTheme(
        <FeedbackFormModal
          open={true}
          roundId="round-1"
          onClose={vi.fn()}
          onSubmitFeedback={mockSubmit}
        />
      );

      expect(screen.getByText('Submit Interview Scorecard & Feedback')).toBeDefined();
      expect(screen.getByText('Overall Candidate Rating')).toBeDefined();
      expect(screen.getByText('Technical Execution Score (1-5)')).toBeDefined();

      const submitBtn = screen.getByRole('button', { name: /Submit Scorecard/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('interviewApi Service', () => {
    it('listInterviews calls GET /interviews', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({
        data: { data: mockCandidateInterviews, count: 2 },
      });

      const res = await interviewApi.listInterviews({ status: 'scheduled' });
      expect(authApiClient.get).toHaveBeenCalledWith('/interviews', {
        params: { status: 'scheduled' },
      });
      expect(res.data.length).toBe(2);
    });

    it('scheduleInterview calls POST /interviews', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({
        data: { message: 'Interview scheduled successfully', interview: mockCandidateInterviews[0] },
      });

      const res = await interviewApi.scheduleInterview({
        candidate_id: 'u1',
        title: 'Tech Screen',
        scheduled_start: '2026-09-02T14:00:00Z',
        scheduled_end: '2026-09-02T15:00:00Z',
      });
      expect(authApiClient.post).toHaveBeenCalledWith('/interviews', {
        candidate_id: 'u1',
        title: 'Tech Screen',
        scheduled_start: '2026-09-02T14:00:00Z',
        scheduled_end: '2026-09-02T15:00:00Z',
      });
      expect(res.interview.title).toBe('Round 1: System Design & Concurrency');
    });

    it('updateInterviewStatus calls PUT /interviews/:id/status', async () => {
      (authApiClient.put as any).mockResolvedValueOnce({
        data: { message: 'Interview status updated successfully', status: 'completed' },
      });

      const res = await interviewApi.updateInterviewStatus('iv-101', 'completed');
      expect(authApiClient.put).toHaveBeenCalledWith('/interviews/iv-101/status', {
        status: 'completed',
      });
      expect(res.status).toBe('completed');
    });
  });
});
