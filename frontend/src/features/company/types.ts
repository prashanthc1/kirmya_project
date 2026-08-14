/**
 * Wire types for the company and organization management API.
 *
 * These mirror `backend/internal/company/models` and
 * `backend/internal/company/domain` exactly. When the Go contract changes,
 * change it here in the same commit — nothing at runtime reconciles the two.
 */

// ---------------------------------------------------------------------------
// Vocabulary (mirrors internal/company/domain)
// ---------------------------------------------------------------------------

export type CompanyRole =
  | 'company_owner'
  | 'org_admin'
  | 'recruiter_admin'
  | 'hiring_manager'
  | 'recruiter'
  | 'employee'
  | 'viewer';

/** Ordered most to least privileged, matching domain.AllRoles(). */
export const COMPANY_ROLES: CompanyRole[] = [
  'company_owner',
  'org_admin',
  'recruiter_admin',
  'hiring_manager',
  'recruiter',
  'employee',
  'viewer',
];

export const ROLE_LABELS: Record<CompanyRole, string> = {
  company_owner: 'Company Owner',
  org_admin: 'Organization Admin',
  recruiter_admin: 'Recruiter Admin',
  hiring_manager: 'Hiring Manager',
  recruiter: 'Recruiter',
  employee: 'Employee',
  viewer: 'Viewer',
};

export type CompanyPermission =
  | 'company:view'
  | 'company:edit'
  | 'company:delete'
  | 'branding:edit'
  | 'settings:edit'
  | 'verification:view'
  | 'verification:submit'
  | 'team:view'
  | 'team:invite'
  | 'team:manage'
  | 'people:approve'
  | 'permission:edit'
  | 'recruiter:view'
  | 'recruiter:invite'
  | 'recruiter:manage'
  | 'job:view'
  | 'job:create'
  | 'job:edit'
  | 'job:publish'
  | 'job:close'
  | 'application:view'
  | 'analytics:view'
  | 'analytics:job:view'
  | 'audit:view'
  | 'ai:insights'
  | 'update:create'
  | 'update:publish'
  | 'update:delete'
  | 'review:respond'
  | 'review:moderate';

export type VerificationStatus =
  | 'not_verified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export type MembershipStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'removed'
  | 'suspended';

export type AssociationType =
  | 'current_employee'
  | 'former_employee'
  | 'contractor'
  | 'recruiter'
  | 'hiring_manager'
  | 'executive'
  | 'intern';

export const ASSOCIATION_LABELS: Record<AssociationType, string> = {
  current_employee: 'Current Employee',
  former_employee: 'Former Employee',
  contractor: 'Contractor',
  recruiter: 'Recruiter',
  hiring_manager: 'Hiring Manager',
  executive: 'Executive',
  intern: 'Intern',
};

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revoked';

export type UpdateStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type UpdateType =
  | 'text'
  | 'image'
  | 'link'
  | 'job_announcement'
  | 'hiring_announcement'
  | 'news'
  | 'event';

export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  text: 'Text',
  image: 'Image',
  link: 'Link',
  job_announcement: 'Job Announcement',
  hiring_announcement: 'Hiring Announcement',
  news: 'Company News',
  event: 'Event',
};

export type ReviewEmploymentType =
  | 'current_employee'
  | 'former_employee'
  | 'contractor'
  | 'intern';

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logoUrl: string;
  coverUrl: string;
  industry: string;
  companyType: string;
  companySize: string;
  headquarters: string;
  followersCount: number;
  employeesCount: number;
  openJobsCount: number;
  rating: number;
  reviewCount: number;
  isHiring: boolean;
  verificationStatus: VerificationStatus;
  /** The only signal the UI may use to render a verified badge. */
  isVerified: boolean;
  isFollowing: boolean;
}

export interface BrandAsset {
  label: string;
  url: string;
  mimeType: string;
}

/**
 * What the requesting user may do on this company. Absent for anonymous and
 * unaffiliated callers. The backend re-checks every permission on write, so
 * this drives which controls render, never whether an action is allowed.
 */
export interface ViewerContext {
  isMember: boolean;
  roles: CompanyRole[];
  permissions: CompanyPermission[];
  isFollowing: boolean;
}

export interface CompanyDetail extends CompanySummary {
  description: string;
  mission: string;
  vision: string;
  history: string;
  workCulture: string;
  careerInfo: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  foundedYear: number;
  socialLinks: Record<string, string>;
  brandAssets: BrandAsset[];
  specialties: string[];
  values: string[];
  benefits: string[];
  products: string[];
  services: string[];
  industries: string[];
  technology: string[];
  awards: string[];
  certifications: string[];
  operatingCountries: string[];
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
  viewer?: ViewerContext;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CompanyListPage = Paginated<CompanySummary>;

/**
 * One company the signed-in user has standing in, with the effective
 * permissions that standing carries. This is what the dashboard's company
 * switcher lists; a company the user can no longer act on is not returned.
 */
export interface CompanyMembership {
  company: CompanySummary;
  roles: CompanyRole[];
  permissions: CompanyPermission[];
}

export interface CompanySearchQuery {
  query?: string;
  industry?: string;
  location?: string;
  size?: string;
  type?: string;
  skills?: string[];
  hiring?: boolean;
  verified?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CompanyDiscovery {
  trending: CompanySummary[];
  hiring: CompanySummary[];
  topEmployers: CompanySummary[];
  fastGrowing: CompanySummary[];
  hiringNearYou: CompanySummary[];
  hiringForYourSkills: CompanySummary[];
  followedByConnections: CompanySummary[];
}

export interface CompanyCreatePayload {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  industry: string;
  companyType?: string;
  companySize?: string;
  foundedYear?: number;
  headquarters?: string;
  website?: string;
  contactEmail?: string;
}

/**
 * Every field is optional and omitted keys are left untouched by the server,
 * which is what lets each settings panel save only its own section.
 */
export interface CompanyUpdatePayload {
  name?: string;
  tagline?: string;
  description?: string;
  industry?: string;
  companyType?: string;
  companySize?: string;
  foundedYear?: number;
  headquarters?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  coverUrl?: string;
  socialLinks?: Record<string, string>;
  brandAssets?: BrandAsset[];
  specialties?: string[];
  values?: string[];
  benefits?: string[];
  mission?: string;
  vision?: string;
  history?: string;
  workCulture?: string;
  careerInfo?: string;
  products?: string[];
  services?: string[];
  industries?: string[];
  technology?: string[];
  awards?: string[];
  certifications?: string[];
  operatingCountries?: string[];
  isHiring?: boolean;
}

export interface FollowPayload {
  notifyUpdates?: boolean;
  notifyJobs?: boolean;
}

// ---------------------------------------------------------------------------
// People and team
// ---------------------------------------------------------------------------

export interface CompanyPerson {
  id: string;
  userId: string;
  name: string;
  photoUrl: string;
  jobTitle: string;
  department: string;
  departmentId?: string;
  location: string;
  associationType: AssociationType;
  status: MembershipStatus;
  role: CompanyRole;
  roles?: CompanyRole[];
  isPublic: boolean;
  /** Present only for callers holding `team:view`. */
  email?: string;
  /**
   * Granted to this member individually, on top of their role. Present only for
   * callers holding `permission:edit`, who are the only ones who can rewrite it.
   */
  extraPermissions?: CompanyPermission[];
  startedAt?: string;
  endedAt?: string;
  joinedAt: string;
}

export interface CompanyDepartment {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
  openJobs: number;
}

export interface PeopleQuery {
  query?: string;
  departmentId?: string;
  associationType?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export type CompanyPeoplePage = Paginated<CompanyPerson>;

export interface AssociationRequestPayload {
  associationType: string;
  jobTitle: string;
  departmentId?: string | null;
  location?: string;
  isPublic: boolean;
}

export interface TeamInvitePayload {
  email: string;
  role: string;
  associationType?: string;
  jobTitle?: string;
  departmentId?: string | null;
  message?: string;
  channel?: string;
}

export interface TeamMemberUpdatePayload {
  role?: string;
  status?: string;
  jobTitle?: string;
  departmentId?: string | null;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  role: CompanyRole;
  associationType: AssociationType;
  jobTitle: string;
  status: InvitationStatus;
  channel: string;
  message: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Returned once, to the inviter, at creation time. `acceptUrl` holds the only
 * copy of the plaintext token that will ever exist.
 */
export interface InvitationIssued {
  invitation: CompanyInvitation;
  acceptUrl: string;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerificationDocument {
  id?: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  /** Zero when unknown: the module stores a link, not the bytes. */
  fileSize?: number;
  mimeType: string;
  checksum?: string;
  createdAt?: string;
}

export interface VerificationSubmitPayload {
  legalName: string;
  registrationNumber: string;
  registrationCountry: string;
  contactEmail: string;
  documents: VerificationDocument[];
}

export interface CompanyVerification {
  id: string;
  companyId: string;
  status: VerificationStatus;
  legalName: string;
  registrationNumber: string;
  registrationCountry: string;
  contactEmail: string;
  submittedBy: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
  documents: VerificationDocument[];
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export interface CompanyJob {
  id: string;
  title: string;
  department: string;
  location: string;
  workMode: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange: string;
  skills: string[];
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  applicationsCount: number;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export type CompanyJobsPage = Paginated<CompanyJob>;

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface CompanyReview {
  id: string;
  companyId: string;
  authorName?: string;
  authorPhotoUrl?: string;
  isAnonymous: boolean;
  isOwnReview: boolean;
  employmentType: ReviewEmploymentType;
  employmentPeriod: string;
  jobTitle?: string;
  overallRating: number;
  workLifeBalance?: number;
  compensationRating?: number;
  cultureRating?: number;
  managementRating?: number;
  careerGrowthRating?: number;
  title: string;
  summary: string;
  pros: string;
  cons: string;
  companyResponse?: string;
  companyResponseAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyReviewsPage extends Paginated<CompanyReview> {
  averageRating: number;
  ratingBreakdown: Record<string, number>;
  canReview: boolean;
}

export interface ReviewPayload {
  employmentType: string;
  employmentStartedOn?: string | null;
  employmentEndedOn?: string | null;
  jobTitle?: string;
  overallRating: number;
  workLifeBalance?: number | null;
  compensationRating?: number | null;
  cultureRating?: number | null;
  managementRating?: number | null;
  careerGrowthRating?: number | null;
  title: string;
  summary: string;
  pros?: string;
  cons?: string;
  isAnonymous?: boolean;
}

export interface ReviewReportPayload {
  reason: string;
  details?: string;
}

export interface ReviewResponsePayload {
  response: string;
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

export interface CompanyUpdate {
  id: string;
  companyId: string;
  authorId: string;
  authorName: string;
  type: UpdateType;
  title: string;
  body: string;
  media: string[];
  links: string[];
  jobId?: string;
  status: UpdateStatus;
  scheduledAt?: string;
  publishedAt?: string;
  viewsCount: number;
  reactionsCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CompanyUpdatesPage = Paginated<CompanyUpdate>;

export interface UpdatePayload {
  type: string;
  title?: string;
  body: string;
  media?: string[];
  links?: string[];
  jobId?: string | null;
  status: string;
  scheduledAt?: string | null;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface RecruiterActivityItem {
  userId: string;
  name: string;
  jobsPosted: number;
  applicationsReviewed: number;
  interviews: number;
  hires: number;
}

export interface CompanyDashboard {
  company: CompanySummary;
  profileCompletion: number;
  verificationStatus: VerificationStatus;
  activeJobs: number;
  applications: number;
  candidates: number;
  interviews: number;
  hires: number;
  followers: number;
  profileViews: number;
  jobViews: number;
  pendingApprovals: number;
  recruiterActivity: RecruiterActivityItem[];
}

export interface AnalyticsPoint {
  date: string;
  profileViews: number;
  uniqueVisitors: number;
  jobViews: number;
  applications: number;
  followers: number;
}

export interface CompanyAnalytics {
  from: string;
  to: string;
  profileViews: number;
  uniqueVisitors: number;
  followers: number;
  followerGrowth: number;
  jobViews: number;
  applications: number;
  /** The counts behind the rates below, so no rate has to be multiplied back out. */
  interviews: number;
  offers: number;
  hires: number;
  applicationConversion: number;
  interviewRate: number;
  offerRate: number;
  hireRate: number;
  candidateSources: Record<string, number>;
  series: AnalyticsPoint[];
  recruiterActivity: RecruiterActivityItem[];
}

export interface JobAnalytics {
  jobId: string;
  title: string;
  views: number;
  uniqueViews: number;
  applications: number;
  qualifiedApplications: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  hires: number;
  conversionRate: number;
  avgTimeToReviewHours: number;
  avgTimeToHireHours: number;
}

export interface AuditEntry {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// AI insights
// ---------------------------------------------------------------------------

export type InsightSeverity = 'info' | 'suggestion' | 'warning';

/**
 * One observation derived from the company's own stored rows. `evidence`
 * names the numbers the observation was computed from, so nothing shown is
 * unattributable.
 */
export interface CompanyInsight {
  id: string;
  category: string;
  severity: InsightSeverity;
  title: string;
  detail: string;
  evidence: string[];
  actions: string[];
}

export interface CompanyInsightsReport {
  companyId: string;
  generatedAt: string;
  from: string;
  to: string;
  summary: string;
  insights: CompanyInsight[];
  suggestedSkills: string[];
}

/** One row of GET /companies/permissions — mirrors service.RoleDescriptor. */
export interface RoleDescriptor {
  role: CompanyRole;
  rank: number;
  permissions: CompanyPermission[];
}

export interface EmployerSettings {
  companyId: string;
  defaultRecruiterId?: string;
  defaultPipeline: string;
  newApplicationNotification: boolean;
  candidateMessageNotification: boolean;
  interviewReminderNotification: boolean;
  autoAcknowledgeApplication: boolean;
  autoAcknowledgeMessage: string;
  candidateVisibilityMode: string;
  dataExportRetentionDays: number;
  updatedAt: string;
}

export interface EmployerSettingsUpdatePayload {
  defaultRecruiterId?: string;
  defaultPipeline?: string;
  newApplicationNotification?: boolean;
  candidateMessageNotification?: boolean;
  interviewReminderNotification?: boolean;
  autoAcknowledgeApplication?: boolean;
  autoAcknowledgeMessage?: string;
  candidateVisibilityMode?: string;
}

export interface TransferOwnershipPayload {
  newOwnerId: string;
  reason?: string;
}

export interface CompanyDataExport {
  id: string;
  companyId: string;
  requestedBy: string;
  status: string;
  exportUrl: string;
  expiresAt: string;
  createdAt: string;
}

