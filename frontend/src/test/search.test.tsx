import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { searchApi } from '../features/search/api';
import GlobalSearchBar from '../components/search/GlobalSearchBar';
import SearchResultCard from '../components/search/SearchResultCard';
import SearchFiltersSidebar from '../components/search/SearchFiltersSidebar';
import RecentSearchesManager from '../components/search/RecentSearchesManager';
import SearchEmptyState from '../components/search/SearchEmptyState';
import SearchPage from '../app/search/page';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/search',
  useSearchParams: () => new URLSearchParams('q=Go&category=all'),
  useParams: () => ({}),
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
    user: { id: 'u1', email: 'user@kirmya.com', name: 'Search User' },
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

describe('Search & Discovery Experience (Prompt 27/50)', () => {
  const mockSearchResponse = {
    query: 'Go',
    category: 'all' as const,
    total_results: 1,
    engine_used: 'postgresql-tsvector-v1',
    results: [
      {
        id: 'j-101',
        type: 'jobs' as const,
        title: 'Senior Go Backend Architect',
        subtitle: 'Enterprise Cloud • Remote',
        description: 'Build high-throughput distributed Go services and PostgreSQL databases.',
        url: '/jobs/j-101',
        score: 0.98,
        metadata: { tags: ['Go', 'PostgreSQL', 'Microservices'] },
      },
    ],
  };

  const mockHistory = [
    {
      id: 'h1',
      user_id: 'u1',
      query: 'Go Backend Architect',
      category_filter: 'jobs',
      results_count: 5,
      searched_at: '2026-09-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (authApiClient.get as any).mockImplementation((url: string) => {
      if (url.includes('/unified-search/suggestions')) {
        return Promise.resolve({
          data: {
            suggestions: [{ text: 'Go Backend Architect', category: 'jobs' }],
            count: 1,
          },
        });
      }
      if (url.includes('/unified-search/history')) {
        return Promise.resolve({
          data: { data: mockHistory, count: 1 },
        });
      }
      if (url.includes('/unified-search')) {
        return Promise.resolve({
          data: mockSearchResponse,
        });
      }
      return Promise.resolve({ data: {} });
    });

    (authApiClient.post as any).mockImplementation((url: string) => {
      if (url.includes('/unified-search/preferences')) {
        return Promise.resolve({ data: { message: 'Preference saved' } });
      }
      if (url.includes('/unified-search/reindex')) {
        return Promise.resolve({ data: { message: 'Reindexing started', status: 'processing' } });
      }
      return Promise.resolve({ data: {} });
    });

    (authApiClient.delete as any).mockImplementation((url: string) => {
      return Promise.resolve({ data: { message: 'Deleted successfully' } });
    });
  });

  describe('searchApi Service', () => {
    it('search calls GET /unified-search with query and category', async () => {
      const res = await searchApi.search('Go', 'jobs');
      expect(authApiClient.get).toHaveBeenCalledWith('/unified-search', {
        params: { q: 'Go', category: 'jobs' },
      });
      expect(res.results.length).toBe(1);
    });

    it('getSuggestions calls GET /unified-search/suggestions', async () => {
      const res = await searchApi.getSuggestions('Go');
      expect(authApiClient.get).toHaveBeenCalledWith('/unified-search/suggestions', {
        params: { q: 'Go' },
      });
      expect(res.suggestions.length).toBe(1);
    });

    it('getUserHistory calls GET /unified-search/history', async () => {
      const res = await searchApi.getUserHistory();
      expect(authApiClient.get).toHaveBeenCalledWith('/unified-search/history');
      expect(res.data.length).toBe(1);
    });

    it('deleteHistoryItem and clearHistory execute successfully', async () => {
      const res1 = await searchApi.deleteHistoryItem('h1');
      expect(authApiClient.delete).toHaveBeenCalledWith('/unified-search/history/h1');
      expect(res1.message).toBe('Deleted successfully');

      const res2 = await searchApi.clearHistory();
      expect(authApiClient.delete).toHaveBeenCalledWith('/unified-search/history');
      expect(res2.message).toBe('Deleted successfully');
    });
  });

  describe('GlobalSearchBar Component', () => {
    it('renders input and responds to input changes and enter key', () => {
      const onQueryChange = vi.fn();
      const onSearch = vi.fn();

      renderWithTheme(
        <GlobalSearchBar
          value="Go"
          onChange={onQueryChange}
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText(/Search People, Jobs/i);
      expect(input).toBeDefined();

      fireEvent.change(input, { target: { value: 'PostgreSQL' } });
      expect(onQueryChange).toHaveBeenCalledWith('PostgreSQL');

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(onSearch).toHaveBeenCalledWith('Go');
    });

    it('triggers clear when clear button is clicked', () => {
      const onQueryChange = vi.fn();
      renderWithTheme(
        <GlobalSearchBar
          value="Go"
          onChange={onQueryChange}
          onSearch={vi.fn()}
        />
      );

      const clearBtn = screen.getByLabelText(/clear search input/i);
      fireEvent.click(clearBtn);
      expect(onQueryChange).toHaveBeenCalledWith('');
    });
  });

  describe('SearchResultCard Component', () => {
    it('renders result title, subtitle, description and tags', () => {
      const item = mockSearchResponse.results[0];

      renderWithTheme(<SearchResultCard item={item} />);

      expect(screen.getByText('Senior Go Backend Architect')).toBeDefined();
      expect(screen.getByText('Enterprise Cloud • Remote')).toBeDefined();
      expect(screen.getByText(/Build high-throughput distributed Go services/i)).toBeDefined();
      expect(screen.getByText('PostgreSQL')).toBeDefined();
      expect(screen.getByRole('link', { name: /View Details/i })).toBeDefined();
    });
  });

  describe('SearchFiltersSidebar Component', () => {
    it('renders filter controls and triggers reset callback', () => {
      const onFilterChange = vi.fn();
      const onReset = vi.fn();

      renderWithTheme(
        <SearchFiltersSidebar
          open={true}
          onClose={vi.fn()}
          filters={{ location: 'Dubai, UAE' }}
          onFilterChange={onFilterChange}
          onReset={onReset}
        />
      );

      expect(screen.getByText('Search Filters')).toBeDefined();
      const resetBtn = screen.getByRole('button', { name: /Reset/i });
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('RecentSearchesManager Component', () => {
    it('renders history items and handles selection and deletion', () => {
      const onSelectQuery = vi.fn();
      const onDeleteItem = vi.fn();
      const onClearAll = vi.fn();

      renderWithTheme(
        <RecentSearchesManager
          history={mockHistory}
          onSelectQuery={onSelectQuery}
          onDeleteItem={onDeleteItem}
          onClearAll={onClearAll}
        />
      );

      expect(screen.getByText('Go Backend Architect')).toBeDefined();
      fireEvent.click(screen.getByText('Go Backend Architect'));
      expect(onSelectQuery).toHaveBeenCalledWith('Go Backend Architect', 'jobs');

      const clearAllBtn = screen.getByRole('button', { name: /Clear/i });
      fireEvent.click(clearAllBtn);
      expect(onClearAll).toHaveBeenCalled();
    });
  });

  describe('SearchEmptyState Component', () => {
    it('renders empty query message and responds to keyword selection', () => {
      const onSelectKeyword = vi.fn();
      renderWithTheme(
        <SearchEmptyState
          query="UnknownTopic"
          onSelectKeyword={onSelectKeyword}
        />
      );

      expect(screen.getByText(/No matching results for "UnknownTopic"/i)).toBeDefined();
      const chip = screen.getByText('Go Backend Architect');
      fireEvent.click(chip);
      expect(onSelectKeyword).toHaveBeenCalledWith('Go Backend Architect');
    });
  });

  describe('SearchPage Main Integration', () => {
    it('renders SearchPage with title, category tabs, and search results', async () => {
      renderWithTheme(<SearchPage />);

      expect(screen.getByText(/Global Search & Multi-Entity Discovery/i)).toBeDefined();
      expect(screen.getByRole('tab', { name: /All Results/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /People/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /Jobs/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /Companies/i })).toBeDefined();

      await waitFor(() => {
        expect(screen.getByText('Senior Go Backend Architect')).toBeDefined();
      }, { timeout: 4000 });
    });
  });
});
