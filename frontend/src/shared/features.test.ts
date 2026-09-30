import { describe, expect, it } from 'vitest';

import { config } from '../proxy';
import { HIDDEN_ROUTE_PREFIXES, isHiddenRoute, visibleItems } from './features';
import { MOBILE_NAV_ITEMS, PRIMARY_NAV_ITEMS, USER_MENU_ITEMS } from './navigation';
import { STATIC_CONTEXTS } from './navigation/contexts';

describe('hidden features', () => {
  it('hides a prefix and everything under it, by whole segment', () => {
    expect(isHiddenRoute('/messages')).toBe(true);
    expect(isHiddenRoute('/messages/abc')).toBe(true);
    expect(isHiddenRoute('/messages?userId=1')).toBe(true);
    expect(isHiddenRoute('/network/')).toBe(true);
    expect(isHiddenRoute('/networking-events')).toBe(false);
    expect(isHiddenRoute('/jobs')).toBe(false);
    expect(isHiddenRoute('/jobs/recommendations')).toBe(false);
    expect(isHiddenRoute('/recruiter/pipeline')).toBe(false);
  });

  it('keeps the proxy matcher in step with the hidden prefixes', () => {
    expect(config.matcher).toEqual(HIDDEN_ROUTE_PREFIXES.map(prefix => `${prefix}/:path*`));
  });

  it('leaves no navigation entry pointing into a hidden area', () => {
    const contextItems = Object.values(STATIC_CONTEXTS).flatMap(context => context.items);
    for (const item of [...PRIMARY_NAV_ITEMS, ...MOBILE_NAV_ITEMS, ...USER_MENU_ITEMS, ...contextItems]) {
      expect(isHiddenRoute(item.href), item.href).toBe(false);
    }
  });

  it('filters by href or route', () => {
    expect(visibleItems([{ href: '/messages' }, { route: '/network' }, { href: '/jobs' }, {}])).toEqual([
      { href: '/jobs' },
      {},
    ]);
  });
});
