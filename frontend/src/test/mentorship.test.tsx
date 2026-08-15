import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import mentorshipApi, { MOCK_MENTORS, MOCK_MENTORSHIPS } from '../features/mentorship/api';
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
    it('searches mentors correctly', async () => {
      const mentors = await mentorshipApi.searchMentors();
      expect(mentors).toBeDefined();
      expect(mentors.length).toBeGreaterThan(0);
      expect(mentors[0]).toHaveProperty('name');
    });

    it('retrieves mentor by ID', async () => {
      const mentor = await mentorshipApi.getMentorById('mentor-1');
      expect(mentor).toBeDefined();
      expect(mentor.id).toBe('mentor-1');
    });

    it('creates mentorship request', async () => {
      const req = await mentorshipApi.createMentorshipRequest({
        mentor_id: 'mentor-1',
        note: 'Test note for mentorship',
      });
      expect(req).toBeDefined();
      expect(req.note).toBe('Test note for mentorship');
    });

    it('creates goal and schedules session', async () => {
      const goal = await mentorshipApi.createGoal('m-100', {
        title: 'Master Vitest Suite',
        description: 'Achieve 100% test coverage',
      });
      expect(goal).toBeDefined();
      expect(goal.title).toBe('Master Vitest Suite');

      const session = await mentorshipApi.scheduleSession('m-100', {
        title: 'Strategy Meeting',
        duration_minutes: 45,
      });
      expect(session).toBeDefined();
      expect(session.title).toBe('Strategy Meeting');
    });

    it('submits feedback', async () => {
      const fb = await mentorshipApi.submitFeedback({
        mentorship_id: 'm-100',
        rating: 5,
        comments: 'Outstanding guidance!',
      });
      expect(fb).toBeDefined();
      expect(fb.rating).toBe(5);
    });
  });

  describe('Mentorship UI Components', () => {
    it('renders MentorCard component with mentor details', () => {
      const mockMentor = MOCK_MENTORS[0];
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
      const mockMentor = MOCK_MENTORS[0];

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
      const mockGoals = MOCK_MENTORSHIPS[0].goals;
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
      const mockSessions = MOCK_MENTORSHIPS[0].sessions;
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
      const mockMentor = MOCK_MENTORS[0];
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
      renderWithProviders(<MentorshipDashboardPage />);
      await waitFor(() => {
        expect(screen.getByText(/Accelerate Your Professional Growth/i)).toBeInTheDocument();
      });
    });

    it('renders MentorDiscoveryPage', async () => {
      renderWithProviders(<MentorDiscoveryPage />);
      await waitFor(() => {
        expect(screen.getByText(/Explore Industry Expert Mentors/i)).toBeInTheDocument();
      });
    });

    it('renders MentorDetailPage', async () => {
      renderWithProviders(<MentorDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/About & Mentorship Philosophy/i)).toBeInTheDocument();
      });
    });

    it('renders MentorshipWorkspacePage', async () => {
      renderWithProviders(<MentorshipWorkspacePage />);
      await waitFor(() => {
        expect(screen.getByText(/Mentorship Workspace with/i)).toBeInTheDocument();
      });
    });
  });
});
