import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'node:fs';
import path from 'node:path';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { isWithin, isExactly, isItemActive, findActiveId } from '../shared/navigation/matchRoute';
import {
  STATIC_CONTEXTS,
  resolveContext,
  companyAdminContext,
  communityAdminContext,
  type NavContext,
} from '../shared/navigation/contexts';
import { PRIMARY_NAV_ITEMS, MOBILE_NAV_ITEMS, PUBLIC_NAV_ITEMS } from '../shared/navigation';
import { canAccessPlatformAdmin, canManageCompany, canManageCommunity } from '../shared/permissions';
import ContextNav from '../components/shell/ContextNav';
import ManageEntityButton from '../components/shell/ManageEntityButton';
import { routes } from '../shared/routes';

/* ------------------------------------------------------------------ */

let mockPathname = '/feed';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const theme = getTheme('light');
const withTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

beforeEach(() => {
  mockPathname = '/feed';
});

/* ------------------------------------------------------------------ */

describe('route matching', () => {
  it('treats paths as segments, so one section cannot claim another', () => {
    // The bug this replaces: startsWith lit Network on /networking.
    expect(isWithin('/networking', '/network')).toBe(false);
    expect(isWithin('/network/connections', '/network')).toBe(true);
    expect(isWithin('/network', '/network')).toBe(true);
    expect(isWithin('/jobs-report', '/jobs')).toBe(false);
  });

  it('distinguishes a section from its own index', () => {
    expect(isExactly('/jobs', '/jobs')).toBe(true);
    expect(isExactly('/jobs/applications', '/jobs')).toBe(false);
    expect(isItemActive('/jobs/applications', { href: '/jobs', exact: true })).toBe(false);
    expect(isItemActive('/jobs/applications', { href: '/jobs' })).toBe(true);
  });

  it('picks the most specific match when several apply', () => {
    const items = [
      { id: 'discover', href: '/jobs', exact: true },
      { id: 'applications', href: '/applications' },
    ];
    expect(findActiveId('/applications', items)).toBe('applications');
  });
});

describe('global navigation', () => {
  it('offers Feed as the signed-in home and stays to five destinations', () => {
    expect(PRIMARY_NAV_ITEMS[0].id).toBe('feed');
    expect(PRIMARY_NAV_ITEMS[0].href).toBe('/feed');
    expect(PRIMARY_NAV_ITEMS).toHaveLength(5);
    expect(PRIMARY_NAV_ITEMS.map(i => i.id)).toEqual([
      'feed', 'network', 'jobs', 'communities', 'messages',
    ]);
  });

  it('names no dashboard anywhere', () => {
    const every = [...PRIMARY_NAV_ITEMS, ...MOBILE_NAV_ITEMS, ...PUBLIC_NAV_ITEMS];
    expect(every.some(i => i.href.startsWith('/dashboard'))).toBe(false);
  });

  it('offers the five thumb destinations on mobile, ending in Me', () => {
    expect(MOBILE_NAV_ITEMS.map(i => i.id)).toEqual([
      'feed', 'network', 'jobs', 'messages', 'profile',
    ]);
  });

  it('marks Feed active on /feed and not on another section', () => {
    const feed = PRIMARY_NAV_ITEMS[0];
    expect(isItemActive('/feed', feed)).toBe(true);
    expect(isItemActive('/jobs', feed)).toBe(false);
  });
});

describe('context navigation', () => {
  it('resolves the module from the path', () => {
    expect(resolveContext('/jobs')?.id).toBe('jobs');
    expect(resolveContext('/jobs/applications')?.id).toBe('jobs');
    expect(resolveContext('/settings/privacy')?.id).toBe('settings');
    expect(resolveContext('/admin/users')?.id).toBe('platform-admin');
    expect(resolveContext('/feed')).toBeNull();
  });

  it('resolves entity contexts, and their management contexts, from the slug', () => {
    expect(resolveContext('/companies/acme')?.id).toBe('company-detail');
    expect(resolveContext('/companies/acme/admin/jobs')?.id).toBe('company-admin');
    expect(resolveContext('/communities/go/admin/settings')?.id).toBe('community-admin');
  });

  it('marks the nested section active — /jobs/applications lights Applications', () => {
    mockPathname = '/applications';
    withTheme(<ContextNav context={STATIC_CONTEXTS.jobs} />);
    const active = screen.getByRole('tab', { name: 'Applications' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('tab', { name: 'Discover' })).not.toHaveAttribute('aria-current');
  });

  it('marks Jobs active on the section index without lighting a sub-tab', () => {
    mockPathname = '/jobs';
    withTheme(<ContextNav context={STATIC_CONTEXTS.jobs} />);
    expect(screen.getByRole('tab', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
  });

  it('lights the right tab inside company management', () => {
    mockPathname = '/companies/acme/admin/jobs';
    withTheme(<ContextNav context={companyAdminContext('acme')} />);
    expect(screen.getByRole('tab', { name: 'Jobs' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('tab', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('renders tabs as links a keyboard and a middle click can use', async () => {
    mockPathname = '/jobs';
    withTheme(<ContextNav context={STATIC_CONTEXTS.jobs} />);
    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => expect(tab.tagName).toBe('A'));
    // Tab order reaches the navigation, and the active tab is the entry point.
    await userEvent.tab();
    expect(document.activeElement?.tagName).toBe('A');
  });

  it('names the navigation landmark for a screen reader', () => {
    mockPathname = '/jobs';
    withTheme(<ContextNav context={STATIC_CONTEXTS.jobs} />);
    expect(screen.getByRole('navigation', { name: /jobs sections/i })).toBeInTheDocument();
  });
});

describe('permissions', () => {
  it('admits the whole admin role set the API admits, not just "admin"', () => {
    expect(canAccessPlatformAdmin({ permissions: ['admin:access'] })).toBe(true);
    expect(canAccessPlatformAdmin({ permissions: [], role: 'platform_admin' })).toBe(true);
    expect(canAccessPlatformAdmin({ permissions: [], role: 'super_admin' })).toBe(true);
    expect(canAccessPlatformAdmin({ permissions: [], role: 'admin' })).toBe(true);
  });

  it('refuses a normal user and an absent viewer', () => {
    expect(canAccessPlatformAdmin({ permissions: ['profile:read'], role: 'user' })).toBe(false);
    expect(canAccessPlatformAdmin(null)).toBe(false);
    expect(canAccessPlatformAdmin(undefined)).toBe(false);
  });

  it('scopes entity authority to the entity, and never infers it from absence', () => {
    expect(canManageCompany({ permissions: ['company:edit'] })).toBe(true);
    expect(canManageCompany({ roles: ['company_owner'] })).toBe(true);
    expect(canManageCompany({ permissions: [] })).toBe(false);
    expect(canManageCompany(null)).toBe(false);
    expect(canManageCommunity({ role: 'owner' })).toBe(true);
    expect(canManageCommunity({ role: 'member' })).toBe(false);
  });
});

describe('the contextual Manage action', () => {
  it('is hidden from a viewer without authority over the company', () => {
    withTheme(<ManageEntityButton kind="company" slug="acme" viewer={{ permissions: [] }} />);
    expect(screen.queryByRole('link', { name: /manage/i })).not.toBeInTheDocument();
  });

  it('is hidden when there is no viewer context at all', () => {
    withTheme(<ManageEntityButton kind="company" slug="acme" viewer={null} />);
    expect(screen.queryByRole('link', { name: /manage/i })).not.toBeInTheDocument();
  });

  it('is shown to an authorised viewer and points inside that company', () => {
    withTheme(
      <ManageEntityButton kind="company" slug="acme" viewer={{ permissions: ['company:edit'] }} />
    );
    const link = screen.getByRole('link', { name: /manage/i });
    expect(link).toHaveAttribute('href', '/companies/acme/admin');
  });

  it('keeps community management inside its own community', () => {
    withTheme(<ManageEntityButton kind="community" slug="gophers" viewer={{ role: 'owner' }} />);
    expect(screen.getByRole('link', { name: /manage/i })).toHaveAttribute(
      'href',
      '/communities/gophers/admin'
    );
  });
});

describe('route registry', () => {
  it('keeps entity management under the entity it manages', () => {
    expect(routes.company.admin.jobs('acme')).toBe('/companies/acme/admin/jobs');
    expect(routes.community.admin.members('go')).toBe('/communities/go/admin/members');
    expect(routes.page.admin.settings('news')).toBe('/pages/news/admin/settings');
  });

  it('encodes a slug once, so a crafted one cannot escape its entity', () => {
    expect(routes.company.admin.jobs('a/b')).toBe('/companies/a%2Fb/admin/jobs');
    expect(routes.company.view('../admin')).toBe('/companies/..%2Fadmin');
  });
});

/* ------------------------------------------------------------------ */

const appDir = path.resolve(__dirname, '..', 'app');

const existingRoutes = (): Set<string> => {
  const found = new Set<string>();
  const walk = (dir: string, url: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        if (entry.name === 'page.tsx') found.add(url || '/');
        continue;
      }
      if (entry.name.startsWith('_') || entry.name.startsWith('@')) continue;
      walk(path.join(dir, entry.name), url + (entry.name.startsWith('(') ? '' : `/${entry.name}`));
    }
  };
  walk(appDir, '');
  return found;
};

describe('broken links', () => {
  it('every navigation destination is a route this application serves', () => {
    // The audit found /about in the public navigation and /job-alerts in the
    // Jobs context, both 404s. Nothing checked, so nothing noticed.
    const routeSet = existingRoutes();
    const dynamic = [...routeSet].filter(r => r.includes('['));

    const resolves = (href: string): boolean => {
      const path = href.split('?')[0];
      if (routeSet.has(path)) return true;
      // A dynamic route matches when the segment counts line up.
      const segments = path.split('/').filter(Boolean);
      return dynamic.some(candidate => {
        const parts = candidate.split('/').filter(Boolean);
        if (parts.length !== segments.length) return false;
        return parts.every((part, i) => part.startsWith('[') || part === segments[i]);
      });
    };

    const everyItem = [
      ...PRIMARY_NAV_ITEMS,
      ...MOBILE_NAV_ITEMS,
      ...PUBLIC_NAV_ITEMS,
      ...(Object.values(STATIC_CONTEXTS) as NavContext[]).flatMap(context => context.items),
      ...companyAdminContext('acme').items,
      ...communityAdminContext('go').items,
    ];

    const broken = everyItem.map(i => i.href).filter(href => !resolves(href));
    expect(broken, 'navigation points at routes that do not exist').toEqual([]);
  });

  it('links to nothing, and never to a placeholder anchor', () => {
    const everyItem = [
      ...PRIMARY_NAV_ITEMS,
      ...MOBILE_NAV_ITEMS,
      ...PUBLIC_NAV_ITEMS,
      ...(Object.values(STATIC_CONTEXTS) as NavContext[]).flatMap(c => c.items),
    ];
    everyItem.forEach(item => {
      expect(item.href).not.toBe('#');
      expect(item.href.startsWith('/')).toBe(true);
    });
  });

  it('has no route left under the removed user dashboard', () => {
    const remaining = [...existingRoutes()].filter(r => r === '/dashboard');
    expect(remaining).toEqual([]);
  });
});
