/**
 * Navigation belonging to a workspace, rather than to a URL prefix.
 *
 * The contextual registry in ./contexts resolves a section from the path, which
 * is right for the professional modules: /jobs is the jobs module wherever you
 * came from. It cannot answer two questions a workspace can.
 *
 * The first is naming. A path carries a company's handle, not its name, so a
 * context resolved from the path alone can only say "Company management" - the
 * same words in every company an account manages. The served workspace carries
 * the real name, so the context row can say which company this is.
 *
 * The second is the phone. The bottom bar is meant to carry the primary
 * destinations of the *active* workspace, and a fixed list of five professional
 * destinations carries the wrong ones everywhere else: a recruiter reviewing a
 * pipeline is offered Feed, Network and Jobs, none of which is where they are.
 *
 * Every destination below is a route this application serves. A tab that
 * answers 404 is worse than a missing one, which is why the freelancer
 * workspace has neither a context nor destinations: /freelance is one screen.
 */
import { ROUTES, routes } from '../routes';
import type { Workspace } from '../workspace/types';
import type { NavContext } from './contexts';
import { communityAdminContext, companyAdminContext, STATIC_CONTEXTS } from './contexts';
import type { NavItem } from './index';
import { MOBILE_NAV_ITEMS } from './index';

/**
 * Recruiting.
 *
 * The recruiting workspace has its own layout and its own sidebar, which is
 * what seventeen destinations need. These five are the ones a thumb reaches for
 * on a phone, where that sidebar stacks above the content and a bottom bar is
 * the faster way back.
 */
const RECRUITING_MOBILE_ITEMS: NavItem[] = [
  { id: 'recruiter-dashboard', label: 'Overview', href: ROUTES.RECRUITER.DASHBOARD, iconName: 'DashboardOutlined', exact: true },
  { id: 'recruiter-jobs', label: 'Jobs', href: ROUTES.RECRUITER.JOBS, iconName: 'WorkOutline' },
  { id: 'recruiter-candidates', label: 'Candidates', href: ROUTES.RECRUITER.CANDIDATES, iconName: 'PeopleOutline' },
  { id: 'recruiter-pipeline', label: 'Pipeline', href: ROUTES.RECRUITER.PIPELINE, iconName: 'ViewKanbanOutlined' },
  { id: 'recruiter-interviews', label: 'Interviews', href: '/recruiter/interviews', iconName: 'EventOutlined' },
];

const PLATFORM_ADMIN_MOBILE_ITEMS: NavItem[] = [
  { id: 'admin-overview', label: 'Overview', href: routes.admin.home(), iconName: 'DashboardOutlined', exact: true },
  { id: 'admin-users', label: 'Users', href: routes.admin.users(), iconName: 'PeopleOutline' },
  { id: 'admin-companies', label: 'Companies', href: routes.admin.companies(), iconName: 'BusinessOutlined' },
  { id: 'admin-moderation', label: 'Moderation', href: routes.admin.moderation(), iconName: 'GavelOutlined' },
  { id: 'admin-system', label: 'System', href: routes.admin.system(), iconName: 'MemoryOutlined' },
];

const companyMobileItems = (slug: string): NavItem[] => [
  { id: 'company-overview', label: 'Overview', href: routes.company.admin.home(slug), iconName: 'DashboardOutlined', exact: true },
  { id: 'company-jobs', label: 'Jobs', href: routes.company.admin.jobs(slug), iconName: 'WorkOutline' },
  { id: 'company-people', label: 'People', href: `/companies/${encodeURIComponent(slug)}/admin/people`, iconName: 'PeopleOutline' },
  { id: 'company-recruiters', label: 'Recruiters', href: routes.company.admin.recruiters(slug), iconName: 'BadgeOutlined' },
  { id: 'company-analytics', label: 'Analytics', href: routes.company.admin.analytics(slug), iconName: 'BarChartOutlined' },
];

const communityMobileItems = (slug: string): NavItem[] => [
  { id: 'community-overview', label: 'Overview', href: routes.community.admin.home(slug), iconName: 'DashboardOutlined', exact: true },
  { id: 'community-moderation', label: 'Moderation', href: routes.community.admin.moderation(slug), iconName: 'GavelOutlined' },
  { id: 'community-settings', label: 'Settings', href: routes.community.admin.settings(slug), iconName: 'SettingsOutlined' },
];

/** The routing handle for an entity workspace: its slug, else its id. */
const handleOf = (workspace: Workspace): string =>
  (workspace.slug && workspace.slug.trim()) || workspace.entityId || '';

/**
 * The contextual navigation for a workspace, or null where the path decides.
 *
 * Only the workspaces whose context the path cannot fully describe are answered
 * here. Everything else falls through to resolveContext, which is the right
 * answer for the professional modules and stays the single registry.
 */
export function workspaceContext(workspace: Workspace | null | undefined): NavContext | null {
  if (!workspace) return null;

  switch (workspace.type) {
    case 'company': {
      const handle = handleOf(workspace);
      if (!handle) return null;
      // The same tabs the path would produce, titled with the company's real
      // name so two companies are told apart by more than the address bar.
      return { ...companyAdminContext(handle), title: workspace.label };
    }
    case 'community_admin': {
      const handle = handleOf(workspace);
      if (!handle) return null;
      return { ...communityAdminContext(handle), title: workspace.label };
    }
    case 'platform_admin':
      return STATIC_CONTEXTS.platformAdmin;
    default:
      // professional, freelancer and recruiting: the path decides. Recruiting
      // carries its own sidebar, and freelancer is a single screen.
      return null;
  }
}

/**
 * The primary destinations for a workspace's mobile bottom bar.
 *
 * Falls back to the professional five, which is correct for the professional
 * workspace and the safest answer for one with no destinations of its own.
 */
export function workspaceMobileItems(workspace: Workspace | null | undefined): NavItem[] {
  if (!workspace) return MOBILE_NAV_ITEMS;

  switch (workspace.type) {
    case 'recruiting':
      return RECRUITING_MOBILE_ITEMS;
    case 'platform_admin':
      return PLATFORM_ADMIN_MOBILE_ITEMS;
    case 'company': {
      const handle = handleOf(workspace);
      return handle ? companyMobileItems(handle) : MOBILE_NAV_ITEMS;
    }
    case 'community_admin': {
      const handle = handleOf(workspace);
      return handle ? communityMobileItems(handle) : MOBILE_NAV_ITEMS;
    }
    default:
      return MOBILE_NAV_ITEMS;
  }
}
