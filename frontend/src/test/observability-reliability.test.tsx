import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import axios from 'axios';

import { ErrorBoundary } from '../shared/monitoring/error_boundary';
import { extractApiError } from '../services/authService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NotFoundPage from '../app/not-found';
import GlobalRouteError from '../app/error';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/not-found',
}));

describe('Kirmya Observability, Error Handling & API Reliability Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractApiError Utility', () => {
    it('extracts canonical error message and code from AxiosError response', () => {
      const mockAxiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            error: 'User profile not found',
            code: 'NOT_FOUND',
            request_id: 'req-abc-123',
          },
          headers: {
            'x-request-id': 'req-abc-123',
          },
        },
      } as any;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = extractApiError(mockAxiosError);
      expect(parsed.message).toBe('User profile not found');
      expect(parsed.code).toBe('NOT_FOUND');
      expect(parsed.requestId).toBe('req-abc-123');
      expect(parsed.status).toBe(404);
    });

    it('handles 429 Rate Limited errors gracefully with user-friendly retry message', () => {
      const mockRateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {},
        },
      } as any;

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = extractApiError(mockRateLimitError);
      expect(parsed.message).toContain('Too many requests');
      expect(parsed.status).toBe(429);
    });

    it('falls back to default safe message on non-axios generic errors', () => {
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const parsed = extractApiError(new Error('Network connection timeout'));
      expect(parsed.message).toBe('Network connection timeout');

      const parsedUnknown = extractApiError(null, 'Custom fallback message');
      expect(parsedUnknown.message).toBe('Custom fallback message');
    });
  });

  describe('ErrorBoundary Component', () => {
    const ProblemChild = () => {
      throw new Error('Test crash inside component tree');
    };

    it('catches render errors and renders glassmorphism fallback UI', () => {
      // Suppress console.error in tests for intentional crash
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred while rendering this view/i)).toBeInTheDocument();
      expect(screen.getByText(/Go Home/i)).toBeInTheDocument();
      expect(screen.getByText(/Reload Page/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('renders normal children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Safe and Healthy Component</div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/Safe and Healthy Component/i)).toBeInTheDocument();
    });
  });

  describe('useNetworkStatus Hook', () => {
    it('initializes with online state and tracks connectivity changes', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.wasOffline).toBe(true);
      expect(result.current.offlineSince).toBeInstanceOf(Date);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.offlineSince).toBeNull();
    });
  });

  describe('NotFound Page Experience', () => {
    it('renders 404 page with Apple design tokens and recovery links', () => {
      render(<NotFoundPage />);

      expect(screen.getByText(/Error 404/i)).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find that page/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search jobs, companies, people/i)).toBeInTheDocument();
      expect(screen.getByText(/Job matches/i)).toBeInTheDocument();
      expect(screen.getByText(/Recommended for you/i)).toBeInTheDocument();
    });

    it('submits search query from 404 page', () => {
      render(<NotFoundPage />);

      const input = screen.getByPlaceholderText(/Search jobs, companies, people/i);
      fireEvent.change(input, { target: { value: 'Frontend Architect' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith('/search?q=Frontend%20Architect');
    });
  });

  describe('GlobalRouteError Component', () => {
    it('renders route crash boundary and triggers reset action', () => {
      const mockReset = vi.fn();
      const testError = Object.assign(new Error('Route dynamic import failed'), { digest: 'digest-456' });

      render(<GlobalRouteError error={testError} reset={mockReset} />);

      expect(screen.getByText(/Something broke/i)).toBeInTheDocument();
      expect(screen.getByText(/This page didn't load/i)).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /Try again/i });
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });
});
