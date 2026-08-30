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
