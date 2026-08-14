import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('q=Go&category=all'),
}));

vi.mock('axios', () => {
  const mAxios = {
    create: vi.fn(() => mAxios),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    get: vi.fn((url: string) => {
      if (url.includes('/unified-search/suggestions')) {
        return Promise.resolve({ data: { suggestions: [{ text: 'Go Developer', category: 'jobs' }], count: 1 } });
      }
      if (url.includes('/unified-search/history')) {
        return Promise.resolve({ data: { data: [{ id: 'h1', query: 'Go', category_filter: 'all', results_count: 5, searched_at: '2026-08-14' }], count: 1 } });
      }
      return Promise.resolve({
        data: {
          query: 'Go',
          category: 'all',
          total_results: 1,
          engine_used: 'postgresql-tsvector-v1',
          results: [
            {
              id: 'j1',
              type: 'jobs',
              title: 'Go Architect',
              subtitle: 'Remote',
              description: 'Build backend microservices in Go.',
              url: '/jobs/1',
              score: 0.95,
            },
          ],
        },
      });
    }),
    post: vi.fn((url: string) => {
      if (url.includes('/unified-search/reindex')) {
        return Promise.resolve({ data: { message: 'Reindexing started', status: 'processing' } });
      }
      return Promise.resolve({ data: { message: 'Success' } });
    }),
    delete: vi.fn(() => Promise.resolve({ data: { message: 'Deleted successfully' } })),
  };
  return { default: mAxios };
});

import { searchApi } from '../features/search/api';
import GlobalSearchBar from '../components/search/GlobalSearchBar';
import SearchResultCard from '../components/search/SearchResultCard';
import SearchFiltersSidebar from '../components/search/SearchFiltersSidebar';
import RecentSearchesManager from '../components/search/RecentSearchesManager';
import SearchEmptyState from '../components/search/SearchEmptyState';
import SearchPage from '../app/search/page';

describe('Search & Discovery Module Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search API Client', () => {
    it('executes searchApi.deleteHistoryItem correctly', async () => {
      const res = await searchApi.deleteHistoryItem('h1');
      expect(res).toEqual({ message: 'Deleted successfully' });
    });

    it('executes searchApi.clearHistory correctly', async () => {
      const res = await searchApi.clearHistory();
      expect(res).toEqual({ message: 'Deleted successfully' });
    });

    it('executes searchApi.reindex correctly', async () => {
      const res = await searchApi.reindex({ full_reindex: true });
      expect(res).toEqual({ message: 'Reindexing started', status: 'processing' });
    });
  });

  describe('GlobalSearchBar Component', () => {
    it('renders input and responds to input changes and enter key', () => {
      const onQueryChange = vi.fn();
      const onSearch = vi.fn();

      render(
        <GlobalSearchBar
          query="Go"
          onQueryChange={onQueryChange}
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText(/Search People, Jobs/i);
      expect(input).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'Python' } });
      expect(onQueryChange).toHaveBeenCalledWith('Python');

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(onSearch).toHaveBeenCalledWith('Go');
    });

    it('triggers clear when clear button clicked', () => {
      const onQueryChange = vi.fn();
      render(
        <GlobalSearchBar
          query="Go"
          onQueryChange={onQueryChange}
          onSearch={vi.fn()}
        />
      );

      const clearBtn = screen.getByLabelText(/clear search input/i);
      fireEvent.click(clearBtn);
      expect(onQueryChange).toHaveBeenCalledWith('');
    });
  });

  describe('SearchResultCard Component', () => {
    it('renders card title, subtitle, description and handles action buttons', () => {
      const onAction = vi.fn();
      const item = {
        id: 'j1',
        type: 'jobs' as const,
        title: 'Senior Go Engineer',
        subtitle: 'Remote • $150k',
        description: 'Build microservices in Go.',
        url: '/jobs/1',
        score: 0.95,
      };

      render(<SearchResultCard item={item} onAction={onAction} />);

      expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
      expect(screen.getByText('Remote • $150k')).toBeInTheDocument();
      expect(screen.getByText('Build microservices in Go.')).toBeInTheDocument();

      const applyBtn = screen.getByRole('button', { name: /Apply/i });
      fireEvent.click(applyBtn);
      expect(onAction).toHaveBeenCalledWith('apply', item);
    });
  });

  describe('SearchFiltersSidebar Component', () => {
    it('renders filter inputs and triggers apply and reset callbacks', () => {
      const onFilterChange = vi.fn();
      const onResetFilters = vi.fn();
      const onApplyFilters = vi.fn();

      render(
        <SearchFiltersSidebar
          open={true}
          onClose={vi.fn()}
          filters={{ location: 'Remote' }}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
          onApplyFilters={onApplyFilters}
          isDrawer={false}
        />
      );

      expect(screen.getByText('Search Filters')).toBeInTheDocument();
      const locationInput = screen.getByPlaceholderText(/e.g. Remote/i);
      expect(locationInput).toHaveValue('Remote');

      const applyBtn = screen.getByRole('button', { name: /Apply Filters/i });
      fireEvent.click(applyBtn);
      expect(onApplyFilters).toHaveBeenCalled();

      const resetBtn = screen.getByRole('button', { name: /Reset/i });
      fireEvent.click(resetBtn);
      expect(onResetFilters).toHaveBeenCalled();
    });
  });

  describe('RecentSearchesManager Component', () => {
    it('renders history items and handles selection and deletion', () => {
      const onSelectSearch = vi.fn();
      const onDeleteItem = vi.fn();
      const onClearAll = vi.fn();
      const history = [
        { id: 'h1', user_id: 'u1', query: 'Go Developer', category_filter: 'jobs', results_count: 10, searched_at: '2026-08-14' },
      ];

      render(
        <RecentSearchesManager
          history={history}
          onSelectSearch={onSelectSearch}
          onDeleteItem={onDeleteItem}
          onClearAll={onClearAll}
        />
      );

      expect(screen.getByText('Go Developer')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Go Developer'));
      expect(onSelectSearch).toHaveBeenCalledWith('Go Developer');

      const clearBtn = screen.getByRole('button', { name: /Clear History/i });
      fireEvent.click(clearBtn);
      expect(onClearAll).toHaveBeenCalled();
    });
  });

  describe('SearchEmptyState Component', () => {
    it('renders empty state message and suggested keyword chips', () => {
      const onSelectKeyword = vi.fn();
      render(
        <SearchEmptyState
          query="UnknownTerm"
          onSelectKeyword={onSelectKeyword}
        />
      );

      expect(screen.getByText(/No results found for "UnknownTerm"/i)).toBeInTheDocument();
      const chip = screen.getByText('Senior Go Backend Architect');
      fireEvent.click(chip);
      expect(onSelectKeyword).toHaveBeenCalledWith('Senior Go Backend Architect');
    });
  });

  describe('SearchPage Main Integration', () => {
    it('renders SearchPage with title and category tabs', async () => {
      render(<SearchPage />);

      expect(screen.getByText(/Unified Kirmya Search Platform/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('All Results')).toBeInTheDocument();
      });
    });
  });
});
