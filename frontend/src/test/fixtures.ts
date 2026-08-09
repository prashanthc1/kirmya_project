/**
 * Fixtures for the company tests.
 *
 * These stand in for API responses, so they are shaped exactly like the wire
 * types. Where a field is only present for a privileged caller — `email`,
 * `extraPermissions` — the fixture leaves it out by default and the test that
 * cares adds it, which is what makes the privacy assertions meaningful.
 */
import {
  CompanyDetail,
  CompanyInvitation,
  CompanyJob,
  CompanyMembership,
  CompanyPermission,
  CompanyPerson,
  CompanyReview,
  CompanyRole,
  CompanySummary,
} from '../features/company/types';

export const companySummary = (overrides: Partial<CompanySummary> = {}): CompanySummary => ({
  id: 'company-1',
  name: 'Northwind Logistics',
  slug: 'northwind-logistics',
  tagline: 'Moving freight, carefully',
  logoUrl: '',
  coverUrl: '',
  industry: 'Aviation & Logistics',
  companyType: 'Privately Held',
  companySize: '201-500',
  headquarters: 'Dubai, UAE',
  followersCount: 1280,
  employeesCount: 42,
  openJobsCount: 6,
  rating: 4.2,
  reviewCount: 18,
  isHiring: true,
  verificationStatus: 'not_verified',
  isVerified: false,
  isFollowing: false,
  ...overrides,
});

export const companyDetail = (overrides: Partial<CompanyDetail> = {}): CompanyDetail => ({
  ...companySummary(),
  description: 'Northwind moves temperature-sensitive freight across the Gulf.',
  mission: '',
  vision: '',
  history: '',
  workCulture: '',
  careerInfo: '',
  website: 'https://northwind.example',
  contactEmail: 'hello@northwind.example',
  contactPhone: '',
  foundedYear: 2011,
  socialLinks: {},
  brandAssets: [],
  specialties: ['Cold chain', 'Customs brokerage'],
  values: [],
  benefits: [],
  products: [],
  services: [],
  industries: [],
  technology: [],
  awards: [],
  certifications: [],
  operatingCountries: ['United Arab Emirates'],
  profileCompletion: 64,
  createdAt: '2023-04-01T09:00:00Z',
  updatedAt: '2024-11-02T09:00:00Z',
  ...overrides,
});

export const person = (overrides: Partial<CompanyPerson> = {}): CompanyPerson => ({
  id: 'member-1',
  userId: 'user-1',
  name: 'Amina Farouk',
  photoUrl: '',
  jobTitle: 'Operations Lead',
  department: 'Operations',
  location: 'Dubai',
  associationType: 'current_employee',
  status: 'approved',
  role: 'employee',
  roles: ['employee'],
  isPublic: true,
  joinedAt: '2023-06-01T09:00:00Z',
  ...overrides,
});

export const membership = (
  roles: CompanyRole[],
  permissions: CompanyPermission[],
  company: Partial<CompanySummary> = {}
): CompanyMembership => ({
  company: companySummary(company),
  roles,
  permissions,
});

export const job = (overrides: Partial<CompanyJob> = {}): CompanyJob => ({
  id: 'job-1',
  title: 'Warehouse Supervisor',
  department: 'Operations',
  location: 'Dubai',
  workMode: 'On-site',
  employmentType: 'Full-time',
  experienceLevel: 'Mid',
  salaryRange: '',
  skills: ['Inventory', 'Safety'],
  status: 'published',
  isFeatured: false,
  viewsCount: 340,
  applicationsCount: 21,
  publishedAt: '2024-10-01T09:00:00Z',
  createdAt: '2024-09-28T09:00:00Z',
  ...overrides,
});

export const review = (overrides: Partial<CompanyReview> = {}): CompanyReview => ({
  id: 'review-1',
  companyId: 'company-1',
  authorName: 'Former employee',
  isAnonymous: true,
  isOwnReview: false,
  employmentType: 'former_employee',
  employmentPeriod: '2021 – 2023',
  overallRating: 4,
  title: 'Steady work, good people',
  summary: 'The operations team is well run and the shift patterns were predictable.',
  pros: '',
  cons: '',
  createdAt: '2024-08-01T09:00:00Z',
  updatedAt: '2024-08-01T09:00:00Z',
  ...overrides,
});

export const invitation = (overrides: Partial<CompanyInvitation> = {}): CompanyInvitation => ({
  id: 'invitation-1',
  companyId: 'company-1',
  email: 'new.recruiter@example.com',
  role: 'recruiter',
  associationType: 'recruiter',
  jobTitle: 'Recruiter',
  status: 'pending',
  channel: 'email',
  message: '',
  invitedBy: 'user-owner',
  expiresAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  ...overrides,
});

export const page = <T,>(items: T[], overrides: Record<string, unknown> = {}) => ({
  items,
  total: items.length,
  page: 1,
  limit: 20,
  totalPages: 1,
  ...overrides,
});
