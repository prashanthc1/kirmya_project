import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({}),
}));

import AdminObservabilityPage from '../app/admin/observability/page';

describe('Observability & Reliability Monitoring Module Test Suite', () => {
  it('renders AdminObservabilityPage studio console', () => {
    render(<AdminObservabilityPage />);
    expect(screen.getByText(/Kirmya Production Observability Studio/i)).toBeInTheDocument();
  });

  it('renders telemetry metrics headers', () => {
    render(<AdminObservabilityPage />);
    expect(screen.getByText(/API P99 LATENCY/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP ERROR RATE/i)).toBeInTheDocument();
  });
});
