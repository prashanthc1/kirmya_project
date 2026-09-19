import { expect, it } from 'vitest';
import { PRIMARY_NAV_ITEMS, MOBILE_NAV_ITEMS, PUBLIC_NAV_ITEMS, USER_MENU_ITEMS } from './index';
import {
  STATIC_CONTEXTS,
  communityContext,
  companyContext,
  pageContext,
  communityAdminContext,
  companyAdminContext,
  pageAdminContext,
} from './contexts';

it('omits deferred destinations from the navigation registries', () => {
  const contexts = [
    ...Object.values(STATIC_CONTEXTS),
    communityContext('navigation-test'),
    companyContext('navigation-test'),
    pageContext('navigation-test'),
    communityAdminContext('navigation-test'),
    companyAdminContext('navigation-test'),
    pageAdminContext('navigation-test'),
  ];
  const hrefs = [
    ...contexts.flatMap(context => context.items),
    ...PRIMARY_NAV_ITEMS,
    ...MOBILE_NAV_ITEMS,
    ...PUBLIC_NAV_ITEMS,
    ...USER_MENU_ITEMS,
  ].map(item => item.href);

  expect(hrefs.filter(href =>
    /^\/(freelance|events|assessments|learning|marketplace|native-mobile|mobile)(\/|$)/.test(href) ||
    /^\/communities\/[^/]+\/(admin\/)?events(\/|$)/.test(href) ||
    /^\/recruiter\/offers(\/|$)/.test(href),
  )).toEqual([]);
  expect(hrefs).toEqual(expect.arrayContaining([
    '/jobs', '/applications', '/profile', '/network', '/messages', '/companies',
    '/recruiter/pipeline', '/admin', '/settings',
  ]));
});
