import { describe, it, expect } from 'vitest';

import { landingRoute, rememberedRoute } from '../shared/workspace/landing';
import type { Workspace } from '../shared/workspace/types';

/*
Where an account lands when it signs in.

The rule is small and the reason to pin it is that every mistake in it is a
redirect someone did not ask for. The returnUrl case is the one with teeth: a
remembered workspace must never displace an explicitly requested page, and it
must never rescue a returnUrl that was refused.
*/

const professional: Workspace = {
  key: 'professional',
  type: 'professional',
  label: 'Professional',
  route: '/feed',
  isDefault: true,
};

const recruiting: Workspace = {
  key: 'recruiting',
  type: 'recruiting',
  label: 'Recruiting',
  route: '/recruiter',
  isDefault: false,
};

const acme: Workspace = {
  key: 'company:2b1c',
  type: 'company',
  entityId: '2b1c',
  label: 'Acme LLC',
  slug: 'acme',
  route: '/companies/acme/admin',
  isDefault: false,
};

const held = [professional, recruiting, acme];

describe('the remembered workspace', () => {
  it('resolves a held key to that workspace route', () => {
    expect(rememberedRoute(held, 'recruiting')).toBe('/recruiter');
    expect(rememberedRoute(held, 'company:2b1c')).toBe('/companies/acme/admin');
  });

  it('resolves nothing for a key the list does not contain', () => {
    // The server already withholds these, so this is the second line rather
    // than the first - but a client that trusted the key blindly would send
    // someone to a workspace they no longer hold.
    expect(rememberedRoute(held, 'platform_admin')).toBeNull();
    expect(rememberedRoute(held, 'company:other')).toBeNull();
  });

  it('resolves nothing when there is no key or no list', () => {
    expect(rememberedRoute(held, null)).toBeNull();
    expect(rememberedRoute(held, undefined)).toBeNull();
    expect(rememberedRoute(held, '')).toBeNull();
    expect(rememberedRoute([], 'recruiting')).toBeNull();
    expect(rememberedRoute(null, 'recruiting')).toBeNull();
  });

  it('refuses a route that is not an in-application path', () => {
    // The route arrives from the network. A workspace whose route is an
    // absolute URL is a redirect off the site, and no workspace needs one.
    const offsite = [{ ...recruiting, route: 'https://evil.example/recruiter' }];
    expect(rememberedRoute(offsite, 'recruiting')).toBeNull();

    const schemeRelative = [{ ...recruiting, route: '//evil.example' }];
    expect(rememberedRoute(schemeRelative, 'recruiting')).toBeNull();

    const blank = [{ ...recruiting, route: '   ' }];
    expect(rememberedRoute(blank, 'recruiting')).toBeNull();
  });
});

describe('where signing in lands', () => {
  it('honours an explicit returnUrl over a remembered workspace', () => {
    expect(
      landingRoute({
        safeReturnUrl: '/jobs/42',
        hadReturnUrl: true,
        workspaces: held,
        lastWorkspaceKey: 'recruiting',
      })
    ).toBe('/jobs/42');
  });

  it('does not let a remembered workspace rescue a refused returnUrl', () => {
    // getSafeReturnUrl answers /feed both for "no returnUrl" and for "one I
    // refused". Only the first may be replaced: someone who asked for
    // somewhere specific and was refused must not be quietly sent elsewhere.
    expect(
      landingRoute({
        safeReturnUrl: '/feed', // what getSafeReturnUrl returns for '//evil.example'
        hadReturnUrl: true,
        workspaces: held,
        lastWorkspaceKey: 'recruiting',
      })
    ).toBe('/feed');
  });

  it('opens the remembered workspace when nothing was asked for', () => {
    expect(
      landingRoute({
        safeReturnUrl: '/feed',
        hadReturnUrl: false,
        workspaces: held,
        lastWorkspaceKey: 'company:2b1c',
      })
    ).toBe('/companies/acme/admin');
  });

  it('falls back to the feed when nothing is remembered', () => {
    expect(
      landingRoute({
        safeReturnUrl: '/feed',
        hadReturnUrl: false,
        workspaces: held,
        lastWorkspaceKey: null,
      })
    ).toBe('/feed');
  });

  it('falls back to the feed when the remembered workspace is gone', () => {
    expect(
      landingRoute({
        safeReturnUrl: '/feed',
        hadReturnUrl: false,
        workspaces: [professional],
        lastWorkspaceKey: 'recruiting',
      })
    ).toBe('/feed');
  });

  it('falls back to the feed for an account served no workspaces at all', () => {
    expect(
      landingRoute({
        safeReturnUrl: '/feed',
        hadReturnUrl: false,
        workspaces: undefined,
        lastWorkspaceKey: 'recruiting',
      })
    ).toBe('/feed');
  });
});
