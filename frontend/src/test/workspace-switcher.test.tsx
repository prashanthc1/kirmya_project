/*
 * The workspace switcher, and the workspace-derivation behind it.
 *
 * Two things are worth pinning down. First, that the active workspace comes
 * from the URL: that is what makes reload, Back and a revoked membership all
 * behave without any stored selection to reconcile. Second, that the control
 * only ever navigates - it renders links to routes that enforce their own
 * authorization, so nothing here can grant anything, and these tests should
 * never be read as evidence that something is protected.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { activeWorkspace } from '../shared/workspace/active';
import type { Workspace } from '../shared/workspace/types';

let currentPath = '/feed';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => currentPath,
  useSearchParams: () => new URLSearchParams(''),
}));

const mockAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuth(),
  default: () => mockAuth(),
}));

import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import WorkspaceSwitcher from '../components/shell/WorkspaceSwitcher';
import AppHeader from '../components/shell/AppHeader';
import MobileDrawer from '../components/shell/MobileDrawer';

const professional: Workspace = {
  key: 'professional', type: 'professional', label: 'Professional',
  route: '/feed', isDefault: true,
};
const freelancer: Workspace = {
  key: 'freelancer', type: 'freelancer', label: 'Freelancing',
  route: '/freelance', isDefault: false,
};
const recruiting: Workspace = {
  key: 'recruiting', type: 'recruiting', label: 'Recruiting',
  route: '/recruiter', isDefault: false,
};
const acme: Workspace = {
  key: 'company:c1', type: 'company', entityId: 'c1', label: 'Acme LLC',
  slug: 'acme', route: '/companies/acme/admin', isDefault: false,
};
const community: Workspace = {
  key: 'community_admin:x1', type: 'community_admin', entityId: 'x1',
  label: 'Go Developers UAE', route: '/communities/x1/admin', isDefault: false,
};
const platform: Workspace = {
  key: 'platform_admin', type: 'platform_admin', label: 'Kirmya Administration',
  route: '/admin', isDefault: false,
};

function signedInWith(workspaces: Workspace[], workspacesComplete = true) {
  mockAuth.mockReturnValue({
    user: { id: 'u1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.invalid', roleId: 'user' },
    authenticated: true,
    status: 'authenticated' as const,
    loading: false,
    permissions: [],
    notificationsCount: 0,
    workspaces,
    workspacesComplete,
    logout: vi.fn(),
  });
}

describe('activeWorkspace', () => {
  const all = [professional, freelancer, recruiting, acme, community, platform];

  it('falls back to the default workspace on an unclaimed path', () => {
    expect(activeWorkspace(all, '/network')?.key).toBe('professional');
    expect(activeWorkspace(all, '/feed')?.key).toBe('professional');
  });

  it('resolves the workspace whose route owns the path', () => {
    expect(activeWorkspace(all, '/recruiter')?.key).toBe('recruiting');
    expect(activeWorkspace(all, '/recruiter/pipeline')?.key).toBe('recruiting');
    expect(activeWorkspace(all, '/companies/acme/admin/jobs')?.key).toBe('company:c1');
    expect(activeWorkspace(all, '/communities/x1/admin/moderation')?.key).toBe('community_admin:x1');
    expect(activeWorkspace(all, '/admin/users')?.key).toBe('platform_admin');
  });

  // Raw string prefixes are how this goes wrong, and the failure puts the user
  // in a workspace they never entered.
  it('matches whole segments, not string prefixes', () => {
    expect(activeWorkspace(all, '/recruiterly')?.key).toBe('professional');
    expect(activeWorkspace(all, '/administration')?.key).toBe('professional');
  });

  it('picks the longest matching route when two could claim the path', () => {
    const second: Workspace = {
      key: 'company:c2', type: 'company', entityId: 'c2', label: 'Acme Labs',
      slug: 'acme', route: '/companies/acme/admin/labs', isDefault: false,
    };
    expect(activeWorkspace([...all, second], '/companies/acme/admin/labs/jobs')?.key).toBe('company:c2');
  });

  // A revoked membership simply stops matching, and the user lands on
  // Professional rather than on an error page.
  it('falls back when the workspace owning the path is gone', () => {
    expect(activeWorkspace([professional, recruiting], '/companies/acme/admin')?.key).toBe('professional');
  });

  it('returns nothing when there are no workspaces', () => {
    expect(activeWorkspace([], '/feed')).toBeNull();
  });
});

describe('WorkspaceSwitcher', () => {
  beforeEach(() => {
    currentPath = '/feed';
    mockAuth.mockReset();
  });

  // A control that cannot switch is a control that does nothing, and every
  // account that has not onboarded anywhere is in that position.
  it('renders nothing for an account with a single workspace', () => {
    signedInWith([professional]);
    const { container } = render(<WorkspaceSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names the current workspace on the trigger', () => {
    signedInWith([professional, recruiting]);
    render(<WorkspaceSwitcher />);
    expect(screen.getByRole('button', { name: /current workspace: professional/i })).toBeInTheDocument();
  });

  it('names the workspace the URL is in, not the default', () => {
    currentPath = '/recruiter/pipeline';
    signedInWith([professional, recruiting]);
    render(<WorkspaceSwitcher />);
    expect(screen.getByRole('button', { name: /current workspace: recruiting/i })).toBeInTheDocument();
  });

  it('lists every entitled workspace as a link to its own route', async () => {
    signedInWith([professional, freelancer, recruiting, acme, community, platform]);
    render(<WorkspaceSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: /change workspace/i }));
    const menu = screen.getByRole('menu');

    const expected: Array<[string, string]> = [
      ['Professional', '/feed'],
      ['Freelancing', '/freelance'],
      ['Recruiting', '/recruiter'],
      ['Acme LLC', '/companies/acme/admin'],
      ['Go Developers UAE', '/communities/x1/admin'],
      ['Kirmya Administration', '/admin'],
    ];
    for (const [label, href] of expected) {
      expect(within(menu).getByRole('menuitem', { name: new RegExp(label, 'i') })).toHaveAttribute('href', href);
    }
  });

  it('marks the current workspace for assistive technology, not by label alone', async () => {
    currentPath = '/companies/acme/admin';
    signedInWith([professional, recruiting, acme]);
    render(<WorkspaceSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: /change workspace/i }));
    const current = screen.getByRole('menuitem', { name: /acme llc/i });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('menuitem', { name: /professional/i })).not.toHaveAttribute('aria-current');
  });

  it('separates personal, entity and platform workspaces', async () => {
    signedInWith([professional, recruiting, acme, platform]);
    render(<WorkspaceSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: /change workspace/i }));
    // Three groups produce two dividers - never one before the first group.
    expect(screen.getByRole('menu').querySelectorAll('hr')).toHaveLength(2);
  });

  it('says so when the served list is incomplete rather than implying revocation', async () => {
    signedInWith([professional, recruiting], false);
    render(<WorkspaceSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: /change workspace/i }));
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/not gone/i)).toBeInTheDocument();
  });

  it('does not show that notice when the list is complete', async () => {
    signedInWith([professional, recruiting], true);
    render(<WorkspaceSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: /change workspace/i }));
    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
  });

  it('tells the drawer to close after a workspace is chosen', async () => {
    const onNavigate = vi.fn();
    signedInWith([professional, recruiting]);
    render(<WorkspaceSwitcher variant="drawer" onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('button', { name: /change workspace/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /recruiting/i }));
    expect(onNavigate).toHaveBeenCalled();
  });

  // Every entry is a link. The switcher navigates and nothing else - it holds
  // no state that any permission decision could read.
  it('offers navigation only, never an action', async () => {
    signedInWith([professional, recruiting, acme, platform]);
    render(<WorkspaceSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: /change workspace/i }));
    for (const item of screen.getAllByRole('menuitem')) {
      expect(item.tagName).toBe('A');
      expect(item).toHaveAttribute('href');
    }
  });
});

/*
 * The navigation entries that used to be driven by roleId.
 *
 * Each of these was wrong before, and wrong in a way no test caught because the
 * assertion would have had to know that registration never writes the values
 * being checked for. They are asserted here against the served workspace list,
 * which is the thing the server actually knows.
 */
describe('shell navigation driven by served workspaces', () => {
  beforeEach(() => {
    currentPath = '/feed';
    mockAuth.mockReset();
  });

  const theme = getTheme('light');
  const withTheme = (ui: React.ReactElement) =>
    render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

  // Before: roleId === 'recruiter' || 'company_admin'. Registration writes
  // "user", so this entry was unreachable for every real account while the API
  // behind it was open to all of them.
  it('offers the recruiter console when the account holds the recruiting workspace', async () => {
    signedInWith([professional, recruiting]);
    withTheme(<AppHeader />);

    await userEvent.click(screen.getByRole('button', { name: /user account menu/i }));
    expect(screen.getByRole('menuitem', { name: /recruiter console/i })).toBeInTheDocument();
  });

  it('withholds it from an account without that workspace, whatever roleId says', async () => {
    mockAuth.mockReturnValue({
      user: { id: 'u1', firstName: 'Ada', lastName: 'L', email: 'a@example.invalid', roleId: 'recruiter' },
      authenticated: true, status: 'authenticated' as const, loading: false,
      permissions: [], notificationsCount: 0,
      workspaces: [professional], workspacesComplete: true, logout: vi.fn(),
    });
    withTheme(<AppHeader />);

    await userEvent.click(screen.getByRole('button', { name: /user account menu/i }));
    expect(screen.queryByRole('menuitem', { name: /recruiter console/i })).not.toBeInTheDocument();
  });

  // Before: MobileDrawer hardcoded platform_admin and admin, omitting
  // super_admin, so desktop and mobile disagreed about who is an administrator.
  it('offers administration to a super_admin on mobile, as the header already did', () => {
    mockAuth.mockReturnValue({
      user: { id: 'u1', firstName: 'Ada', lastName: 'L', email: 'a@example.invalid', roleId: 'super_admin' },
      authenticated: true, status: 'authenticated' as const, loading: false,
      permissions: [], notificationsCount: 0,
      workspaces: [professional, platform], workspacesComplete: true, logout: vi.fn(),
    });
    withTheme(<MobileDrawer open onClose={vi.fn()} />);

    const entry = screen.getByRole('link', { name: /kirmya administration/i });
    // And it leads where the header sends administrators. It pointed at
    // /admin/dashboard, which has no page, so this entry rendered a not-found
    // screen for every administrator on a phone.
    expect(entry).toHaveAttribute('href', '/admin');
  });

  // Before: both surfaces displayed user.roleId, which reads "user" for every
  // normally registered account.
  it('never shows the internal role vocabulary as a human-readable subtitle', async () => {
    signedInWith([professional, recruiting]);
    withTheme(<AppHeader />);

    await userEvent.click(screen.getByRole('button', { name: /user account menu/i }));
    expect(screen.queryByText(/^user$/i)).not.toBeInTheDocument();
  });

  it('puts the switcher in the drawer for small screens', () => {
    signedInWith([professional, recruiting]);
    withTheme(<MobileDrawer open onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: /change workspace/i })).toBeInTheDocument();
  });
});
