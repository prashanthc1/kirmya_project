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

import DataOperationsStudio from '../components/admin/data_operations/DataOperationsStudio';

describe('Data Operations, Import/Export & Bulk Ops Module Test Suite', () => {
  it('renders DataOperationsStudio header', () => {
    render(<DataOperationsStudio />);
    expect(screen.getByText(/Kirmya Data Operations, Import & Bulk Studio/i)).toBeInTheDocument();
  });

  it('renders summary cards for imports and exports', () => {
    render(<DataOperationsStudio />);
    expect(screen.getByText(/TOTAL IMPORTS/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE EXPORTS/i)).toBeInTheDocument();
    expect(screen.getByText(/BULK OPERATIONS/i)).toBeInTheDocument();
  });
});
