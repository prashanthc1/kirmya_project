import { ROUTES } from '../routes';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  badgeKey?: 'notifications' | 'messages';
  /*
   * There is deliberately no `roles` field. There was one, read from
   * users.role_id, and nothing writes that column with anything but 'user', so
   * every item it gated was either always shown or never shown. Whether an item
   * belongs to an account is decided by which workspace the item is in, and the
   * server decides which workspaces the account has.
   */
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

/*
 * The recruiter and admin console sidebars used to live here, keyed to
 * users.role_id: roles: ['recruiter', 'company_admin'] and
 * ['platform_admin', 'admin']. They are gone.
 *
 * They were unreachable - AppShell's sidebarVariant defaults to null and no
 * page ever passed one - and they were the role-keyed navigation the workspace
 * model replaces. Navigation now follows the workspace the account is in, which
 * the server resolves; see ./workspaceNav. Keeping a second, contradictory
 * navigation around, one that reads a vocabulary registration never writes, is
 * how role-keyed behaviour comes back.
 */

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
