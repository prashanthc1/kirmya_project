/*
 * Navigation keyed to the workspace rather than to a URL prefix.
 *
 * Two things the path alone cannot supply, and these test both. An entity's
 * name: the address bar carries a handle, so a context resolved from it says
 * "Company management" in every company alike. And the phone's bottom bar,
 * which is meant to offer the primary destinations of the workspace the account
 * is actually in, rather than the professional five everywhere.
 *
 * As ever, this is presentation. Every destination is a link to a route that
 * authorizes its own callers; nothing here protects anything.
 */
import { describe, it, expect } from 'vitest';

import { workspaceContext, workspaceMobileItems } from '../shared/navigation/workspaceNav';
import { MOBILE_NAV_ITEMS } from '../shared/navigation';
import { resolveContext } from '../shared/navigation/contexts';
import type { Workspace } from '../shared/workspace/types';

const professional: Workspace = {
  key: 'professional', type: 'professional', label: 'Professional', route: '/feed', isDefault: true,
};
const recruiting: Workspace = {
  key: 'recruiting', type: 'recruiting', label: 'Recruiting', route: '/recruiter', isDefault: false,
};
const acme: Workspace = {
  key: 'company:c1', type: 'company', entityId: 'c1', label: 'Acme LLC',
  slug: 'acme', route: '/companies/acme/admin', isDefault: false,
};
const goDevs: Workspace = {
  key: 'community_admin:x1', type: 'community_admin', entityId: 'x1',
  label: 'Go Developers UAE', route: '/communities/x1/admin', isDefault: false,
};
const platform: Workspace = {
  key: 'platform_admin', type: 'platform_admin', label: 'Kirmya Administration',
  route: '/admin', isDefault: false,
};

describe('contextual navigation keyed to workspace', () => {
  it('titles a company context with the company, not the generic noun', () => {
    const context = workspaceContext(acme);
    expect(context?.title).toBe('Acme LLC');

    // Which is the thing the path cannot say: it carries the handle only.
    expect(resolveContext('/companies/acme/admin')?.title).toBe('Company management');
  });

  it('tells two managed companies apart in the context row', () => {
    const other: Workspace = { ...acme, key: 'company:c2', entityId: 'c2', label: 'Example Technologies', slug: 'example' };
    expect(workspaceContext(acme)?.title).toBe('Acme LLC');
    expect(workspaceContext(other)?.title).toBe('Example Technologies');
  });

  it('keeps the same sections the path would have produced', () => {
    const fromWorkspace = workspaceContext(acme);
    const fromPath = resolveContext('/companies/acme/admin');
    expect(fromWorkspace?.items.map(i => i.href)).toEqual(fromPath?.items.map(i => i.href));
  });

  it('titles a community context with the community', () => {
    expect(workspaceContext(goDevs)?.title).toBe('Go Developers UAE');
    expect(workspaceContext(goDevs)?.items.length).toBeGreaterThan(1);
  });

  it('leaves the path in charge where the workspace knows nothing extra', () => {
    // Professional, freelancer and recruiting resolve from the path: the
    // registry stays the one place sections are listed.
    expect(workspaceContext(professional)).toBeNull();
    expect(workspaceContext(recruiting)).toBeNull();
    expect(workspaceContext(null)).toBeNull();
  });

  it('falls back rather than producing a context with no entity', () => {
    const nameless: Workspace = { ...acme, slug: '', entityId: '' };
    expect(workspaceContext(nameless)).toBeNull();
  });
});

describe('mobile destinations keyed to workspace', () => {
  it('offers the professional five by default', () => {
    expect(workspaceMobileItems(professional)).toEqual(MOBILE_NAV_ITEMS);
    expect(workspaceMobileItems(null)).toEqual(MOBILE_NAV_ITEMS);
  });

  it('offers recruiting destinations in the recruiting workspace', () => {
    const items = workspaceMobileItems(recruiting);
    expect(items).not.toEqual(MOBILE_NAV_ITEMS);
    expect(items.every(item => item.href.startsWith('/recruiter'))).toBe(true);
  });

  it('scopes company destinations to that company', () => {
    const items = workspaceMobileItems(acme);
    expect(items.every(item => item.href.startsWith('/companies/acme/admin'))).toBe(true);
  });

  it('scopes community destinations to that community', () => {
    const items = workspaceMobileItems(goDevs);
    expect(items.every(item => item.href.startsWith('/communities/x1/admin'))).toBe(true);
  });

  it('offers administration destinations in the platform workspace', () => {
    const items = workspaceMobileItems(platform);
    expect(items.every(item => item.href.startsWith('/admin'))).toBe(true);
  });

  // A phone bottom bar with six targets has none that are comfortable to hit.
  it('never offers more than five destinations, in any workspace', () => {
    for (const workspace of [professional, recruiting, acme, goDevs, platform]) {
      expect(workspaceMobileItems(workspace).length).toBeLessThanOrEqual(5);
      expect(workspaceMobileItems(workspace).length).toBeGreaterThan(0);
    }
  });

  it('gives every destination a distinct id and a real path', () => {
    for (const workspace of [professional, recruiting, acme, goDevs, platform]) {
      const items = workspaceMobileItems(workspace);
      expect(new Set(items.map(i => i.id)).size).toBe(items.length);
      for (const item of items) {
        expect(item.href).toMatch(/^\/[a-zA-Z0-9_\-\/%]*$/);
        expect(item.label).toBeTruthy();
      }
    }
  });

  it('falls back for an entity workspace that names no entity', () => {
    expect(workspaceMobileItems({ ...acme, slug: '', entityId: '' })).toEqual(MOBILE_NAV_ITEMS);
  });
});
