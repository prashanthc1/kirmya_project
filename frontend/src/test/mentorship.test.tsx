import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import mentorshipApi from '../features/mentorship/api';
import { apiClient } from '../services/api';
import { MENTOR_FIXTURES, MENTORSHIP_FIXTURES } from './fixtures/mentorship';

// The client used to answer these from fixtures compiled into it, so the suite
// exercised the fixtures. It talks to the API now, and the API is mocked here.
vi.mock('../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
import MentorCard from '../components/mentorship/MentorCard';
import MentorFiltersSidebar from '../components/mentorship/MentorFiltersSidebar';
import MentorshipRequestModal from '../components/mentorship/MentorshipRequestModal';
import MentorshipGoalsCard from '../components/mentorship/MentorshipGoalsCard';
import MentorshipSessionsCard from '../components/mentorship/MentorshipSessionsCard';
import MentorProfileEditor from '../components/mentorship/MentorProfileEditor';
import MentorshipFeedbackModal from '../components/mentorship/MentorshipFeedbackModal';
import MentorshipDashboardPage from '../app/mentorship/page';
import MentorDiscoveryPage from '../app/mentorship/mentors/page';
import MentorDetailPage from '../app/mentorship/mentors/[id]/page';
import MentorshipWorkspacePage from '../app/mentorship/[id]/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/mentorship',
  useParams: () => ({ id: 'mentor-1' }),
}));

const theme = createTheme();
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('Kirmya Mentorship & Career Guidance Suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </QueryClientProvider>
    );
  };

  describe('Mentorship API Client', () => {
    it('searches mentors through the search endpoint and unwraps the envelope', async () => {
      mockedClient.get.mockResolvedValueOnce({ data: { mentors: MENTOR_FIXTURES } });
      const mentors = await mentorshipApi.searchMentors({ search: 'go' } as any);
      expect(mockedClient.get).toHaveBeenCalledWith('/mentorship/mentors/search', { params: { search: 'go' } });
      expect(mentors).toHaveLength(MENTOR_FIXTURES.length);
    });

    it('returns an empty list rather than inventing mentors when there are none', async () => {
      mockedClient.get.mockResolvedValueOnce({ data: { mentors: [] } });
      await expect(mentorshipApi.searchMentors()).resolves.toEqual([]);
    });

    it('propagates a failed search instead of falling back to fixtures', async () => {
      mockedClient.get.mockRejectedValueOnce(new Error('network down'));
      await expect(mentorshipApi.searchMentors()).rejects.toThrow('network down');
    });

    it('creates a mentorship request against the real route', async () => {
      mockedClient.post.mockResolvedValueOnce({ data: { request: { id: 'r1', note: 'Test note' } } });
      const req = await mentorshipApi.createMentorshipRequest({ mentor_id: 'mentor-1', note: 'Test note' });
      expect(mockedClient.post).toHaveBeenCalledWith('/mentorship/requests', { mentor_id: 'mentor-1', note: 'Test note' });
      expect(req.note).toBe('Test note');
    });

    it('creates a goal and a session on the mentorship they belong to', async () => {
      mockedClient.post.mockResolvedValueOnce({ data: { goal: { id: 'g1', title: 'Master Vitest' } } });
      const goal = await mentorshipApi.createGoal('m-100', { title: 'Master Vitest' });
      expect(mockedClient.post).toHaveBeenCalledWith('/mentorship/goals', { title: 'Master Vitest', mentorship_id: 'm-100' });
      expect(goal.title).toBe('Master Vitest');

      mockedClient.post.mockResolvedValueOnce({ data: { session: { id: 's1', title: 'Strategy Meeting' } } });
      const session = await mentorshipApi.scheduleSession('m-100', { title: 'Strategy Meeting' });
      expect(mockedClient.post).toHaveBeenCalledWith('/mentorship/sessions', { title: 'Strategy Meeting', mentorship_id: 'm-100' });
      expect(session.title).toBe('Strategy Meeting');
    });

    it('deletes a goal through the endpoint that now exists', async () => {
      mockedClient.delete.mockResolvedValueOnce({ data: { message: 'goal deleted' } });
      await mentorshipApi.deleteGoal('m-100', 'g1');
      expect(mockedClient.delete).toHaveBeenCalledWith('/mentorship/goals/g1');
    });

    it('submits feedback', async () => {
      mockedClient.post.mockResolvedValueOnce({ data: { feedback: { id: 'f1', rating: 5 } } });
      const fb = await mentorshipApi.submitFeedback({ mentorship_id: 'm-100', rating: 5 });
      expect(mockedClient.post).toHaveBeenCalledWith('/mentorship/feedback', { mentorship_id: 'm-100', rating: 5 });
      expect(fb.rating).toBe(5);
    });
  });

  describe('Mentorship UI Components', () => {
    it('renders MentorCard component with mentor details', () => {
      const mockMentor = MENTOR_FIXTURES[0];
      const handleRequest = vi.fn();
      renderWithProviders(
        <MentorCard mentor={mockMentor} onRequestMentorship={handleRequest} />
      );

      expect(screen.getByText(mockMentor.name)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockMentor.title, 'i'))).toBeInTheDocument();
      expect(screen.getByText(/Request/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Request/i));
      expect(handleRequest).toHaveBeenCalledWith(mockMentor);
    });

    it('renders MentorFiltersSidebar and handles search filter changes', () => {
      const handleFilterChange = vi.fn();
      const handleReset = vi.fn();
      const filters = { search: '', availability: 'all' as const };

      renderWithProviders(
        <MentorFiltersSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />
      );

      expect(screen.getByText(/Filter Mentors/i)).toBeInTheDocument();
      const searchInput = screen.getByPlaceholderText(/Search name, title, skill/i);
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });
      expect(handleFilterChange).toHaveBeenCalled();
    });

    it('renders MentorshipRequestModal and submits request', async () => {
      const handleClose = vi.fn();
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      const mockMentor = MENTOR_FIXTURES[0];

      renderWithProviders(
        <MentorshipRequestModal
          open={true}
          onClose={handleClose}
          mentor={mockMentor}
          onSubmit={handleSubmit}
        />
      );

      expect(screen.getByText(/Request Mentorship/i)).toBeInTheDocument();
      const noteInput = screen.getByPlaceholderText(/Introduce yourself/i);
      fireEvent.change(noteInput, { target: { value: 'I want guidance on AI career path.' } });

      const submitBtn = screen.getByText(/Send Request/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it('renders MentorshipGoalsCard and manages goals', async () => {
      const mockGoals = MENTORSHIP_FIXTURES[0].goals;
      const handleAddGoal = vi.fn().mockResolvedValue(undefined);
      const handleUpdateGoal = vi.fn().mockResolvedValue(undefined);
      const handleDeleteGoal = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <MentorshipGoalsCard
          goals={mockGoals}
          onAddGoal={handleAddGoal}
          onUpdateGoal={handleUpdateGoal}
          onDeleteGoal={handleDeleteGoal}
        />
      );

      expect(screen.getByText(/Mentorship Goals/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Goal/i)).toBeInTheDocument();
      expect(screen.getByText(mockGoals[0].title)).toBeInTheDocument();
    });

    it('renders MentorshipSessionsCard and displays scheduled sessions', () => {
      const mockSessions = MENTORSHIP_FIXTURES[0].sessions;
      const handleScheduleSession = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <MentorshipSessionsCard
          sessions={mockSessions}
          onScheduleSession={handleScheduleSession}
        />
      );

      expect(screen.getByText(/Mentorship Sessions/i)).toBeInTheDocument();
      expect(screen.getByText(mockSessions[0].title)).toBeInTheDocument();
    });

    it('renders MentorProfileEditor and handles input state', () => {
      const mockMentor = MENTOR_FIXTURES[0];
      const handleSave = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <MentorProfileEditor profile={mockMentor} onSave={handleSave} />
      );

      expect(screen.getByText(/Mentor Profile & Capacity Settings/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Preferences/i)).toBeInTheDocument();
    });

    it('renders MentorshipFeedbackModal', async () => {
      const handleClose = vi.fn();
      const handleSubmit = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <MentorshipFeedbackModal
          open={true}
          onClose={handleClose}
          mentorshipId="m-100"
          onSubmit={handleSubmit}
        />
      );

      expect(screen.getByText(/Leave Mentorship Feedback/i)).toBeInTheDocument();
      const submitBtn = screen.getByText(/Submit Feedback/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Mentorship App Router Pages', () => {
    it('renders MentorshipDashboardPage', async () => {
      mockedClient.get.mockResolvedValue({ data: { mentorships: MENTORSHIP_FIXTURES, requests: [] } });
      renderWithProviders(<MentorshipDashboardPage />);
      await waitFor(() => {
        expect(screen.getByText(/Accelerate Your Professional Growth/i)).toBeInTheDocument();
      });
    });

    it('renders MentorDiscoveryPage', async () => {
      mockedClient.get.mockResolvedValue({ data: { mentors: MENTOR_FIXTURES } });
      renderWithProviders(<MentorDiscoveryPage />);
      await waitFor(() => {
        expect(screen.getByText(/Explore Industry Expert Mentors/i)).toBeInTheDocument();
      });
    });

    it('renders MentorDetailPage from what the API returns', async () => {
      mockedClient.get.mockResolvedValue({ data: { profile: MENTOR_FIXTURES[0] } });
      renderWithProviders(<MentorDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/About & Mentorship Philosophy/i)).toBeInTheDocument();
      });
    });

    it('renders MentorshipWorkspacePage from what the API returns', async () => {
      mockedClient.get.mockResolvedValue({ data: { mentorship: MENTORSHIP_FIXTURES[0] } });
      renderWithProviders(<MentorshipWorkspacePage />);
      await waitFor(() => {
        expect(screen.getByText(/Mentorship Workspace with/i)).toBeInTheDocument();
      });
    });
  });
});
