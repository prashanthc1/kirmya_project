/**
 * Contextual (secondary) navigation, as typed configuration.
 *
 * Global navigation answers "where am I in Kirmya?" and stays short. This
 * answers "what can I do here?", per module, and is the reason every screen
 * does not need its own bespoke header. One registry, consumed by one
 * component, instead of a navbar implementation per page.
 *
 * Only sections the product actually serves appear here. A tab that leads
 * nowhere is worse than an absent one.
 */
import { ROUTES, routes } from '../routes';
import type { MatchableItem } from './matchRoute';

export interface ContextNavItem extends MatchableItem {
  id: string;
  label: string;
  href: string;
  /** Rendered as an accessible label where the item shows an icon. */
  description?: string;
}

export interface NavContext {
  id: string;
  /** Shown above the tabs where the module needs naming. */
  title?: string;
  items: ContextNavItem[];
}

/** Contexts that do not depend on an entity slug. */
export const STATIC_CONTEXTS = {
  jobs: {
    id: 'jobs',
    title: 'Jobs',
    items: [
      { id: 'discover', label: 'Discover', href: routes.jobs.home(), exact: true },
      { id: 'recommended', label: 'Recommended', href: routes.jobs.recommended() },
      { id: 'saved', label: 'Saved', href: routes.jobs.saved() },
      { id: 'applications', label: 'Applications', href: routes.jobs.applications() },
      { id: 'alerts', label: 'Alerts', href: routes.jobs.alerts() },
    ],
  },
  network: {
    id: 'network',
    title: 'Network',
    items: [
      { id: 'overview', label: 'Overview', href: ROUTES.NETWORK, exact: true },
      { id: 'connections', label: 'Connections', href: '/network/connections' },
      { id: 'requests', label: 'Requests', href: '/network/requests' },
      { id: 'suggestions', label: 'Suggestions', href: '/network/suggestions' },
    ],
  },
  communities: {
    id: 'communities',
    title: 'Communities',
    items: [
      { id: 'discover', label: 'Discover', href: routes.communities.home(), exact: true },
    ],
  },
  companies: {
    id: 'companies',
    title: 'Companies',
    items: [{ id: 'discover', label: 'Discover', href: routes.companies.home(), exact: true }],
  },
  freelance: {
    id: 'freelance',
    title: 'Freelance',
    items: [{ id: 'discover', label: 'Discover', href: routes.freelance.home(), exact: true }],
  },
  events: {
    id: 'events',
    title: 'Events',
    items: [{ id: 'discover', label: 'Discover', href: routes.events.home(), exact: true }],
  },
  profile: {
    id: 'profile',
    title: 'Profile',
    items: [
      { id: 'overview', label: 'Overview', href: ROUTES.PROFILE, exact: true },
      { id: 'edit', label: 'Edit', href: ROUTES.EDIT_PROFILE },
      { id: 'completion', label: 'Completion', href: '/profile/completion' },
      { id: 'preview', label: 'Preview', href: '/profile/preview' },
    ],
  },
  settings: {
    id: 'settings',
    title: 'Settings',
    items: [
      { id: 'general', label: 'General', href: ROUTES.SETTINGS.ROOT, exact: true },
      { id: 'notifications', label: 'Notifications', href: '/settings/notifications' },
      { id: 'privacy', label: 'Privacy', href: '/settings/privacy' },
      { id: 'security', label: 'Security', href: '/settings/security' },
      { id: 'data', label: 'Data', href: '/settings/data' },
      { id: 'safety', label: 'Safety', href: '/settings/safety' },
    ],
  },
  notifications: {
    id: 'notifications',
    title: 'Notifications',
    items: [
      { id: 'all', label: 'All', href: ROUTES.NOTIFICATIONS, exact: true },
      { id: 'unread', label: 'Unread', href: '/notifications/unread' },
      { id: 'jobs', label: 'Jobs', href: '/notifications/jobs' },
      { id: 'network', label: 'Network', href: '/notifications/network' },
      { id: 'messages', label: 'Messages', href: '/notifications/messages' },
    ],
  },
  platformAdmin: {
    id: 'platform-admin',
    title: 'Kirmya administration',
    items: [
      { id: 'overview', label: 'Overview', href: routes.admin.home(), exact: true },
      { id: 'users', label: 'Users', href: routes.admin.users() },
      { id: 'companies', label: 'Companies', href: routes.admin.companies() },
      { id: 'communities', label: 'Communities', href: routes.admin.communities() },
      { id: 'jobs', label: 'Jobs', href: routes.admin.jobs() },
      // Pages and Freelance administration are absent on purpose: neither
      // /admin/pages nor /admin/freelance is a route in this application, and
      // the API serves no administrative endpoints for either. A tab that
      // answers 404 is worse than a missing one.
      { id: 'moderation', label: 'Moderation', href: routes.admin.moderation() },
      { id: 'reports', label: 'Reports', href: routes.admin.reports() },
      { id: 'security', label: 'Security', href: routes.admin.security() },
      { id: 'audit-logs', label: 'Audit logs', href: routes.admin.auditLogs() },
      { id: 'system', label: 'System', href: routes.admin.system() },
    ],
  },
} satisfies Record<string, NavContext>;

/* ---------- entity contexts, built from a slug ---------- */

export const communityContext = (slug: string): NavContext => ({
  id: 'community-detail',
  items: [
    { id: 'home', label: 'Home', href: routes.community.view(slug), exact: true },
    { id: 'discussions', label: 'Discussions', href: routes.community.discussions(slug) },
    { id: 'members', label: 'Members', href: routes.community.members(slug) },
    { id: 'events', label: 'Events', href: routes.community.events(slug) },
    { id: 'about', label: 'About', href: routes.community.about(slug) },
  ],
});

export const companyContext = (slug: string): NavContext => ({
  id: 'company-detail',
  items: [
    { id: 'overview', label: 'Overview', href: routes.company.view(slug), exact: true },
    { id: 'posts', label: 'Posts', href: routes.company.posts(slug) },
    { id: 'jobs', label: 'Jobs', href: routes.company.jobs(slug) },
    { id: 'people', label: 'People', href: routes.company.people(slug) },
    { id: 'about', label: 'About', href: routes.company.about(slug) },
  ],
});

export const pageContext = (slug: string): NavContext => ({
  id: 'page-detail',
  items: [{ id: 'overview', label: 'Overview', href: routes.page.view(slug), exact: true }],
});

/**
 * Company management.
 *
 * Posts and Applicants are absent: the route builders exist, but no screen does
 * yet. People is here because the screen does. Tabs follow screens.
 */
export const companyAdminContext = (slug: string): NavContext => ({
  id: 'company-admin',
  title: 'Company management',
  items: [
    { id: 'overview', label: 'Overview', href: routes.company.admin.home(slug), exact: true },
    { id: 'profile', label: 'Profile', href: routes.company.admin.profile(slug) },
    { id: 'jobs', label: 'Jobs', href: routes.company.admin.jobs(slug) },
    { id: 'people', label: 'People', href: '/companies/' + encodeURIComponent(slug) + '/admin/people' },
    { id: 'recruiters', label: 'Recruiters', href: routes.company.admin.recruiters(slug) },
    { id: 'analytics', label: 'Analytics', href: routes.company.admin.analytics(slug) },
    { id: 'verification', label: 'Verification', href: '/companies/' + encodeURIComponent(slug) + '/admin/verification' },
    { id: 'settings', label: 'Settings', href: routes.company.admin.settings(slug) },
  ],
});

/**
 * Community management.
 *
 * Overview, Moderation and Settings are the sections this product serves. The
 * route builders cover Members, Content, Events, Analytics and Admins as well,
 * because the management API supports them, but no screen exists for any of
 * them yet and a tab that answers 404 is worse than a missing one. Add the tab
 * with the screen, not before it.
 */
export const communityAdminContext = (slug: string): NavContext => ({
  id: 'community-admin',
  title: 'Community management',
  items: [
    { id: 'overview', label: 'Overview', href: routes.community.admin.home(slug), exact: true },
    { id: 'moderation', label: 'Moderation', href: routes.community.admin.moderation(slug) },
    { id: 'settings', label: 'Settings', href: routes.community.admin.settings(slug) },
  ],
});

export const pageAdminContext = (slug: string): NavContext => ({
  id: 'page-admin',
  title: 'Page management',
  items: [
    { id: 'overview', label: 'Overview', href: routes.page.admin.home(slug), exact: true },
    { id: 'content', label: 'Content', href: routes.page.admin.content(slug) },
    { id: 'followers', label: 'Followers', href: routes.page.admin.followers(slug) },
    { id: 'analytics', label: 'Analytics', href: routes.page.admin.analytics(slug) },
    { id: 'settings', label: 'Settings', href: routes.page.admin.settings(slug) },
    { id: 'admins', label: 'Admins', href: routes.page.admin.admins(slug) },
  ],
});

/**
 * The context for a pathname, where it can be decided from the path alone.
 *
 * Entity contexts need their slug, which the path carries, so they are resolved
 * here too rather than in each layout.
 */
export const resolveContext = (pathname: string): NavContext | null => {
  const segments = pathname.split('?')[0].split('/').filter(Boolean);
  const [first, second, third] = segments;

  if (!first) return null;

  if (first === 'communities' && second && second !== 'create') {
    return third === 'admin' ? communityAdminContext(second) : communityContext(second);
  }
  if (first === 'companies' && second) {
    return third === 'admin' ? companyAdminContext(second) : companyContext(second);
  }
  if (first === 'pages' && second) {
    return third === 'admin' ? pageAdminContext(second) : pageContext(second);
  }

  switch (first) {
    case 'jobs':
      return STATIC_CONTEXTS.jobs;
    case 'saved-jobs':
    case 'applications':
    case 'job-alerts':
      return STATIC_CONTEXTS.jobs;
    case 'network':
      return STATIC_CONTEXTS.network;
    case 'communities':
      return STATIC_CONTEXTS.communities;
    case 'companies':
      return STATIC_CONTEXTS.companies;
    case 'freelance':
      return STATIC_CONTEXTS.freelance;
    case 'events':
      return STATIC_CONTEXTS.events;
    case 'profile':
      return STATIC_CONTEXTS.profile;
    case 'settings':
      return STATIC_CONTEXTS.settings;
    case 'notifications':
      return STATIC_CONTEXTS.notifications;
    case 'admin':
      return STATIC_CONTEXTS.platformAdmin;
    default:
      return null;
  }
};
