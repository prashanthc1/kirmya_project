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

import BackupDashboard from '../components/admin/backups/BackupDashboard';

describe('Backup, Disaster Recovery & Resilience Module Test Suite', () => {
  it('renders BackupDashboard studio header', () => {
    render(<BackupDashboard />);
    expect(screen.getByText(/Kirmya Backup, Disaster Recovery & Resilience Studio/i)).toBeInTheDocument();
  });

  it('renders recovery health badges and RPO/RTO metrics', () => {
    render(<BackupDashboard />);
    expect(screen.getByText(/RECOVERY HEALTH/i)).toBeInTheDocument();
    expect(screen.getByText(/RPO COMPLIANCE/i)).toBeInTheDocument();
    expect(screen.getByText(/RTO TARGET/i)).toBeInTheDocument();
  });
});
