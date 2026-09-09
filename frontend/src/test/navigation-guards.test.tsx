import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import RequirePermission from '../components/shell/RequirePermission';
import { canAccessPlatformAdmin } from '../shared/permissions';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/users',
  useRouter: () => ({ push: vi.fn(), replace }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

let authState: { status: string; permissions: string[]; user: unknown } = {
  status: 'authenticated',
  permissions: [],
  user: { roleId: 'user' },
};
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => authState,
  default: () => authState,
}));

const theme = getTheme('light');
const renderGuard = () =>
  render(
    <ThemeProvider theme={theme}>
      <RequirePermission allow={v => canAccessPlatformAdmin(v)} label="Kirmya administration">
        <div>Platform admin console</div>
      </RequirePermission>
    </ThemeProvider>
  );

beforeEach(() => {
  replace.mockClear();
});

describe('platform administration is isolated', () => {
  it('is refused to a normal signed-in user who types the URL', () => {
    authState = { status: 'authenticated', permissions: ['profile:read'], user: { roleId: 'user' } };
    renderGuard();
    expect(screen.queryByText('Platform admin console')).not.toBeInTheDocument();
    expect(screen.getByText(/do not have access to Kirmya administration/i)).toBeInTheDocument();
  });

  it('opens for an account carrying the administrative permission', () => {
    authState = { status: 'authenticated', permissions: ['admin:access'], user: { roleId: 'admin' } };
    renderGuard();
    expect(screen.getByText('Platform admin console')).toBeInTheDocument();
  });

  it('opens for every role the API itself admits', () => {
    for (const roleId of ['admin', 'super_admin', 'platform_admin']) {
      authState = { status: 'authenticated', permissions: [], user: { roleId } };
      const { unmount } = renderGuard();
      expect(screen.getByText('Platform admin console'), `${roleId} was refused`).toBeInTheDocument();
      unmount();
    }
  });

  it('sends a signed-out visitor to sign in, carrying where they were going', () => {
    authState = { status: 'unauthenticated', permissions: [], user: null };
    renderGuard();
    expect(replace).toHaveBeenCalledWith('/login?returnUrl=%2Fadmin%2Fusers');
    expect(screen.queryByText('Platform admin console')).not.toBeInTheDocument();
  });

  it('shows neither the console nor a refusal while the session is still loading', () => {
    // "Not yet known" is not "denied": treating it as denied refuses every reload.
    authState = { status: 'loading', permissions: [], user: null };
    renderGuard();
    expect(screen.queryByText('Platform admin console')).not.toBeInTheDocument();
    expect(screen.queryByText(/do not have access/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
