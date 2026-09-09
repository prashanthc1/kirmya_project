import { ROUTES } from '../routes';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  badgeKey?: 'notifications' | 'messages';
  roles?: ('candidate' | 'recruiter' | 'company_admin' | 'platform_admin' | string)[];
  exact?: boolean;
}

/**
 * Primary navigation for a signed-in professional.
 *
 * Five destinations, and deliberately not one more. Global navigation answers
 * "where am I in Kirmya?"; everything a module contains is reached from that
 * module's own context navigation, not from here. Notifications, search and the
 * account menu are global *actions* and live beside these rather than in them.
 *
 * Feed is first because it is the signed-in home. There is no dashboard.
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'feed', label: 'Feed', href: ROUTES.FEED, iconName: 'HomeOutlined', exact: true },
  { id: 'network', label: 'Network', href: ROUTES.NETWORK, iconName: 'PeopleOutline' },
  { id: 'jobs', label: 'Jobs', href: ROUTES.JOBS, iconName: 'WorkOutline' },
  { id: 'communities', label: 'Communities', href: ROUTES.COMMUNITIES, iconName: 'ForumOutlined' },
  { id: 'messages', label: 'Messages', href: ROUTES.MESSAGES, iconName: 'ChatBubbleOutline', badgeKey: 'messages' },
];

/**
 * Mobile primary destinations.
 *
 * Feed, Network, Jobs, Messages and Me — the five a thumb reaches for. Not the
 * desktop row made smaller: Communities moves into the drawer because a phone
 * bottom bar with six targets has none that are comfortable to hit.
 */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { id: 'feed', label: 'Feed', href: ROUTES.FEED, iconName: 'HomeOutlined', exact: true },
  { id: 'network', label: 'Network', href: ROUTES.NETWORK, iconName: 'PeopleOutline' },
  { id: 'jobs', label: 'Jobs', href: ROUTES.JOBS, iconName: 'WorkOutline' },
  { id: 'messages', label: 'Messages', href: ROUTES.MESSAGES, iconName: 'ChatBubbleOutline', badgeKey: 'messages' },
  { id: 'profile', label: 'Me', href: ROUTES.PROFILE, iconName: 'PersonOutline' },
];

/**
 * Public and unauthenticated navigation.
 *
 * Only destinations that exist. `/about` was linked here and is not a route in
 * this application - it answered 404 for every visitor who clicked it - so it
 * is replaced by Help, which is real.
 */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { id: 'jobs', label: 'Find Jobs', href: ROUTES.JOBS, iconName: 'WorkOutline' },
  { id: 'companies', label: 'Companies', href: ROUTES.COMPANIES, iconName: 'BusinessOutlined' },
  { id: 'communities', label: 'Communities', href: ROUTES.COMMUNITIES, iconName: 'ForumOutlined' },
  { id: 'help', label: 'Help', href: ROUTES.HELP, iconName: 'HelpOutline' },
];

/**
 * Recruiter Secondary Console Navigation Items
 */
export const RECRUITER_NAV_ITEMS: NavItem[] = [
  { id: 'recruiter-dashboard', label: 'Recruiter Dashboard', href: ROUTES.RECRUITER.DASHBOARD, iconName: 'DashboardOutlined', roles: ['recruiter', 'company_admin'] },
  { id: 'recruiter-jobs', label: 'Job Postings', href: ROUTES.RECRUITER.JOBS, iconName: 'WorkOutline', roles: ['recruiter', 'company_admin'] },
  { id: 'recruiter-candidates', label: 'Candidates & Search', href: ROUTES.RECRUITER.CANDIDATES, iconName: 'SearchOutlined', roles: ['recruiter', 'company_admin'] },
  { id: 'recruiter-pipeline', label: 'Hiring Pipeline', href: ROUTES.RECRUITER.PIPELINE, iconName: 'ViewKanbanOutlined', roles: ['recruiter', 'company_admin'] },
  { id: 'recruiter-analytics', label: 'Talent Analytics', href: ROUTES.RECRUITER.ANALYTICS, iconName: 'BarChartOutlined', roles: ['recruiter', 'company_admin'] },
];

/**
 * Admin Console Navigation Items
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'admin-dashboard', label: 'Overview', href: ROUTES.ADMIN.DASHBOARD, iconName: 'DashboardOutlined', roles: ['platform_admin', 'admin'] },
  { id: 'admin-users', label: 'User Directory', href: ROUTES.ADMIN.USERS, iconName: 'PeopleOutline', roles: ['platform_admin', 'admin'] },
  { id: 'admin-moderation', label: 'Moderation Queue', href: ROUTES.ADMIN.MODERATION, iconName: 'GavelOutlined', roles: ['platform_admin', 'admin'] },
  { id: 'admin-audit', label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, iconName: 'HistoryOutlined', roles: ['platform_admin', 'admin'] },
  { id: 'admin-analytics', label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS, iconName: 'BarChartOutlined', roles: ['platform_admin', 'admin'] },
  { id: 'admin-settings', label: 'System Settings', href: ROUTES.ADMIN.SETTINGS, iconName: 'MemoryOutlined', roles: ['platform_admin', 'admin'] },
];

/**
 * Account Menu Dropdown Items
 */
export const USER_MENU_ITEMS: NavItem[] = [
  { id: 'profile', label: 'Your Profile', href: ROUTES.PROFILE, iconName: 'PersonOutline' },
  { id: 'applications', label: 'My Applications', href: ROUTES.APPLICATIONS, iconName: 'AssignmentOutlined' },
  { id: 'saved-jobs', label: 'Saved Jobs', href: ROUTES.SAVED_JOBS, iconName: 'BookmarkBorder' },
  { id: 'settings', label: 'Account Settings', href: ROUTES.SETTINGS.ROOT, iconName: 'SettingsOutlined' },
  { id: 'help', label: 'Help & FAQ', href: ROUTES.HELP, iconName: 'HelpOutline' },
];
