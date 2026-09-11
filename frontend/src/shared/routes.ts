/**
 * Kirmya Platform Centralized Route Definitions (Prompt 12/50)
 * 
 * Provides type-safe path constants and parameterized route builders.
 */

export const ROUTES = {
  // Public & Marketing
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  CAREERS: '/careers',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  HELP: '/help',
  SUPPORT: '/support',
  FAQS: '/faqs',

  // Authentication
  LOGIN: '/login',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  VERIFICATION: '/verification',
  AUTH: {
    LOGIN: '/login',
    SIGNIN: '/signin',
    SIGNUP: '/signup',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
  },

  // Core Candidate Journeys
  FEED: '/feed',
  JOBS: '/jobs',
  JOB_DETAIL: (id: string) => `/jobs/${encodeURIComponent(id)}`,
  APPLICATIONS: '/applications',
  APPLICATION_DETAIL: (id: string) => `/applications/${encodeURIComponent(id)}`,
  SAVED_JOBS: '/saved-jobs',
  JOB_ALERTS: '/job-alerts',
  FREELANCE_ONBOARDING: '/freelance/onboarding',

  // Profile & Documents
  PROFILE: '/profile',
  PROFILE_ME: '/profile/me',
  USER_PROFILE: (handleOrId: string) => `/profile/${encodeURIComponent(handleOrId)}`,
  EDIT_PROFILE: '/profile/edit',
  RESUME: '/resume',
  RESUME_BUILDER: '/resume/builder',
  COVER_LETTER: '/cover-letter',
  DOCUMENTS: '/documents',

  // Networking & Communication
  NETWORK: '/network',
  NETWORKING: '/networking',
  CONNECTIONS: '/network/connections',
  INVITATIONS: '/network/invitations',
  PEOPLE: '/network/people',
  MESSAGES: '/messages',
  MESSAGING: '/messaging',
  CONVERSATION: (id: string) => `/messages/${encodeURIComponent(id)}`,
  COMMUNITIES: '/communities',
  COMMUNITY_DETAIL: (id: string) => `/communities/${encodeURIComponent(id)}`,
  COMMUNITY_CREATE: '/communities/create',
  NOTIFICATIONS: '/notifications',

  // Career AI & Tools
  AI_JOB_MATCH: '/ai-job-match',
  CAREER_COMPANION: '/career-companion',
  CAREER_ASSISTANT: '/career-assistant',
  INTERVIEW_PREP: '/interview-prep',
  INTERVIEWS: '/interviews',
  INTERVIEW_ROOM: (id: string) => `/interviews/${encodeURIComponent(id)}`,
  ASSESSMENTS: '/assessments',
  MENTORSHIP: '/mentorship',
  LEARNING: '/learning',

  // Companies & Organizations
  COMPANIES: '/companies',
  COMPANY_DETAIL: (handle: string) => `/companies/${encodeURIComponent(handle)}`,
  COMPANY_DASHBOARD: '/company/dashboard',
  COMPANY_CREATE: '/company/create',
  COMPANY_JOBS: '/company/jobs',
  COMPANY_ANALYTICS: '/company/analytics',

  // Recruiter & ATS
  RECRUITER: {
    DASHBOARD: '/recruiter/dashboard',
    JOBS: '/recruiter/jobs',
    JOB_CREATE: '/recruiter/jobs/create',
    JOB_EDIT: (id: string) => `/recruiter/jobs/${encodeURIComponent(id)}/edit`,
    APPLICANTS: (jobId: string) => `/recruiter/jobs/${encodeURIComponent(jobId)}/applicants`,
    CANDIDATES: '/recruiter/candidates',
    SEARCH: '/recruiter/search',
    PIPELINE: '/recruiter/pipeline',
    INTERVIEWS: '/recruiter/interviews',
    ANALYTICS: '/recruiter/analytics',
  },

  // Enterprise Hiring
  ENTERPRISE: {
    DASHBOARD: '/enterprise/dashboard',
    POOLS: '/enterprise/talent-pools',
    TEAM: '/enterprise/team',
    SETTINGS: '/enterprise/settings',
    COMPLIANCE: '/enterprise/compliance',
    ANALYTICS: '/enterprise/analytics',
  },

  // Billing & Subscriptions
  BILLING: {
    ROOT: '/billing',
    PLANS: '/billing/plans',
    INVOICES: '/billing/invoices',
    SUBSCRIPTION: '/billing/subscription',
    PAYMENT_METHODS: '/billing/payment-methods',
  },

  // User Settings & Privacy
  SETTINGS: {
    ROOT: '/settings',
    ACCOUNT: '/settings/account',
    PRIVACY: '/settings/privacy',
    SECURITY: '/settings/security',
    NOTIFICATIONS: '/settings/notifications',
    DATA_EXPORT: '/settings/data-export',
  },

  // Platform Administration
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    COMPANIES: '/admin/companies',
    JOBS: '/admin/jobs',
    APPLICATIONS: '/admin/applications',
    COMMUNITIES: '/admin/communities',
    MODERATION: '/admin/trust-safety',
    AUDIT_LOGS: '/admin/audit-logs',
    ANALYTICS: '/admin/analytics',
    DATA_OPERATIONS: '/admin/data-operations',
    BACKUPS: '/admin/backups',
    INCIDENTS: '/admin/incidents',
    SETTINGS: '/admin/settings',
  },
} as const;

/**
 * Entity-scoped route builders.
 *
 * Management lives inside the entity it manages - `/companies/acme/admin/jobs`,
 * not a global console - so that a URL carries the authority it needs and a
 * viewer who holds a role on one company cannot reach another's by editing a
 * query parameter. Every segment is encoded once, here, rather than at each
 * call site.
 */
const slugPath = (base: string, slug: string, ...rest: string[]): string =>
  [base, encodeURIComponent(slug), ...rest].join('/');

export const routes = {
  home: () => ROUTES.HOME,
  feed: () => ROUTES.FEED,
  network: { home: () => ROUTES.NETWORK },
  messages: {
    home: () => ROUTES.MESSAGES,
    conversation: (id: string) => ROUTES.CONVERSATION(id),
  },
  notifications: () => ROUTES.NOTIFICATIONS,
  settings: { home: () => ROUTES.SETTINGS.ROOT },
  profile: { home: () => ROUTES.PROFILE, edit: () => ROUTES.EDIT_PROFILE },

  jobs: {
    home: () => ROUTES.JOBS,
    detail: (id: string) => ROUTES.JOB_DETAIL(id),
    recommended: () => '/jobs/recommendations',
    saved: () => ROUTES.SAVED_JOBS,
    applications: () => ROUTES.APPLICATIONS,
    alerts: () => ROUTES.JOB_ALERTS,
  },

  freelance: {
    home: () => '/freelance',
    /** Becoming a freelancer. Reachable by any signed-in professional account. */
    onboarding: () => ROUTES.FREELANCE_ONBOARDING,
  },
  events: { home: () => '/events' },

  companies: { home: () => ROUTES.COMPANIES },
  company: {
    view: (slug: string) => slugPath('/companies', slug),
    posts: (slug: string) => slugPath('/companies', slug, 'posts'),
    jobs: (slug: string) => slugPath('/companies', slug, 'jobs'),
    people: (slug: string) => slugPath('/companies', slug, 'people'),
    about: (slug: string) => slugPath('/companies', slug, 'about'),
    admin: {
      home: (slug: string) => slugPath('/companies', slug, 'admin'),
      profile: (slug: string) => slugPath('/companies', slug, 'admin', 'profile'),
      posts: (slug: string) => slugPath('/companies', slug, 'admin', 'posts'),
      jobs: (slug: string) => slugPath('/companies', slug, 'admin', 'jobs'),
      applicants: (slug: string) => slugPath('/companies', slug, 'admin', 'applicants'),
      recruiters: (slug: string) => slugPath('/companies', slug, 'admin', 'recruiters'),
      analytics: (slug: string) => slugPath('/companies', slug, 'admin', 'analytics'),
      settings: (slug: string) => slugPath('/companies', slug, 'admin', 'settings'),
    },
  },

  communities: { home: () => ROUTES.COMMUNITIES },
  community: {
    view: (slug: string) => slugPath('/communities', slug),
    discussions: (slug: string) => slugPath('/communities', slug, 'discussions'),
    members: (slug: string) => slugPath('/communities', slug, 'members'),
    events: (slug: string) => slugPath('/communities', slug, 'events'),
    about: (slug: string) => slugPath('/communities', slug, 'about'),
    admin: {
      home: (slug: string) => slugPath('/communities', slug, 'admin'),
      members: (slug: string) => slugPath('/communities', slug, 'admin', 'members'),
      content: (slug: string) => slugPath('/communities', slug, 'admin', 'content'),
      moderation: (slug: string) => slugPath('/communities', slug, 'admin', 'moderation'),
      events: (slug: string) => slugPath('/communities', slug, 'admin', 'events'),
      analytics: (slug: string) => slugPath('/communities', slug, 'admin', 'analytics'),
      settings: (slug: string) => slugPath('/communities', slug, 'admin', 'settings'),
      admins: (slug: string) => slugPath('/communities', slug, 'admin', 'admins'),
    },
  },

  /**
   * Pages.
   *
   * The navigation architecture supports a Page entity - context, management
   * context and permission check are all in place - but the API serves no
   * /pages resource at all, so no Page screens exist and none are linked. These
   * builders are the contract a Pages module would arrive against; nothing
   * references them until it does.
   */
  pages: { home: () => '/pages' },
  page: {
    view: (slug: string) => slugPath('/pages', slug),
    admin: {
      home: (slug: string) => slugPath('/pages', slug, 'admin'),
      content: (slug: string) => slugPath('/pages', slug, 'admin', 'content'),
      followers: (slug: string) => slugPath('/pages', slug, 'admin', 'followers'),
      analytics: (slug: string) => slugPath('/pages', slug, 'admin', 'analytics'),
      settings: (slug: string) => slugPath('/pages', slug, 'admin', 'settings'),
      admins: (slug: string) => slugPath('/pages', slug, 'admin', 'admins'),
    },
  },

  admin: {
    home: () => ROUTES.ADMIN.ROOT,
    users: () => '/admin/users',
    companies: () => ROUTES.ADMIN.COMPANIES,
    pages: () => '/admin/pages',
    communities: () => ROUTES.ADMIN.COMMUNITIES,
    jobs: () => ROUTES.ADMIN.JOBS,
    freelance: () => '/admin/freelance',
    moderation: () => '/admin/moderation',
    reports: () => '/admin/reports',
    security: () => '/admin/security',
    auditLogs: () => ROUTES.ADMIN.AUDIT_LOGS,
    system: () => '/admin/system',
  },
} as const;
