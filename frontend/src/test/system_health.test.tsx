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

import SystemHealthStudio from '../components/admin/system_health/SystemHealthStudio';
import MaintenanceOverlay from '../components/system/MaintenanceOverlay';

describe('System Health, Diagnostics & Self-Healing Test Suite', () => {
  it('renders SystemHealthStudio header', () => {
    render(<SystemHealthStudio />);
    expect(screen.getByText(/Kirmya System Health & Diagnostics Studio/i)).toBeInTheDocument();
  });

  it('renders MaintenanceOverlay component', () => {
    render(<MaintenanceOverlay reason="Scheduled Maintenance Test" />);
    expect(screen.getByText(/Kirmya System Maintenance/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled Maintenance Test/i)).toBeInTheDocument();
  });
});
