/**
 * Form schemas for the company module.
 *
 * These mirror the `binding` tags on the Go payloads. The server validates
 * independently and is the authority; validating here only saves the user a
 * round trip, so where the two could drift the Go rule is the one to match.
 */
import { z } from 'zod';

/** Lowercase letters, digits and single hyphens — the slug appears in a URL. */
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === '' || /^https?:\/\/.+/.test(value), {
    message: 'Enter a full URL starting with http:// or https://',
  });

export const companyCreateSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(255),
  slug: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(100)
    .regex(slugPattern, 'Use lowercase letters, numbers and hyphens only'),
  tagline: z.string().trim().max(255).optional().or(z.literal('')),
  description: z.string().trim().max(20000).optional().or(z.literal('')),
  industry: z.string().trim().min(1, 'Select an industry'),
  companyType: z.string().trim().optional().or(z.literal('')),
  companySize: z.string().trim().optional().or(z.literal('')),
  foundedYear: z
    .union([z.coerce.number().int().min(1800).max(new Date().getFullYear()), z.literal('')])
    .optional(),
  headquarters: z.string().trim().max(255).optional().or(z.literal('')),
  website: optionalUrl.optional().or(z.literal('')),
  contactEmail: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
});

export type CompanyCreateForm = z.infer<typeof companyCreateSchema>;

export const companyProfileSchema = z.object({
  name: z.string().trim().min(2).max(255),
  tagline: z.string().trim().max(255).or(z.literal('')),
  description: z.string().trim().max(20000).or(z.literal('')),
  industry: z.string().trim().max(120).or(z.literal('')),
  companyType: z.string().trim().max(120).or(z.literal('')),
  companySize: z.string().trim().max(60).or(z.literal('')),
  foundedYear: z
    .union([z.coerce.number().int().min(1800).max(new Date().getFullYear()), z.literal('')])
    .optional(),
  headquarters: z.string().trim().max(255).or(z.literal('')),
  website: optionalUrl,
  contactEmail: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  contactPhone: z.string().trim().max(60).or(z.literal('')),
  mission: z.string().trim().max(5000).or(z.literal('')),
  vision: z.string().trim().max(5000).or(z.literal('')),
  history: z.string().trim().max(20000).or(z.literal('')),
  workCulture: z.string().trim().max(20000).or(z.literal('')),
  careerInfo: z.string().trim().max(20000).or(z.literal('')),
});

export type CompanyProfileForm = z.infer<typeof companyProfileSchema>;

export const brandingSchema = z.object({
  logoUrl: optionalUrl,
  coverUrl: optionalUrl,
  socialLinks: z.record(z.string(), optionalUrl),
});

export type BrandingForm = z.infer<typeof brandingSchema>;

export const verificationSchema = z.object({
  legalName: z.string().trim().min(2, 'Enter the registered legal name').max(255),
  registrationNumber: z.string().trim().min(2, 'Enter the registration number').max(120),
  registrationCountry: z.string().trim().min(2, 'Select the country of registration'),
  contactEmail: z.string().trim().email('Enter a valid email address'),
});

export type VerificationForm = z.infer<typeof verificationSchema>;

export const inviteSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  role: z.string().min(1, 'Choose a role'),
  associationType: z.string().optional().or(z.literal('')),
  jobTitle: z.string().trim().max(255).optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  channel: z.string().optional().or(z.literal('')),
});

export type InviteForm = z.infer<typeof inviteSchema>;

export const associationSchema = z.object({
  associationType: z.string().min(1, 'Choose how you are associated'),
  jobTitle: z.string().trim().min(1, 'Enter your job title').max(255),
  departmentId: z.string().optional().or(z.literal('')),
  location: z.string().trim().max(255).optional().or(z.literal('')),
  isPublic: z.boolean(),
});

export type AssociationForm = z.infer<typeof associationSchema>;

const rating = z.coerce.number().int().min(1, 'Choose a rating').max(5);
const optionalRating = z.union([z.coerce.number().int().min(1).max(5), z.literal(0)]).optional();

export const reviewSchema = z.object({
  employmentType: z.string().min(1, 'Choose your employment type'),
  employmentStartedOn: z.string().optional().or(z.literal('')),
  employmentEndedOn: z.string().optional().or(z.literal('')),
  jobTitle: z.string().trim().max(255).optional().or(z.literal('')),
  overallRating: rating,
  workLifeBalance: optionalRating,
  compensationRating: optionalRating,
  cultureRating: optionalRating,
  managementRating: optionalRating,
  careerGrowthRating: optionalRating,
  title: z.string().trim().min(1, 'Add a headline').max(255),
  // The server enforces a 40-character floor; a review shorter than that is
  // rejected rather than stored, so the form has to hold the same line.
  summary: z.string().trim().min(40, 'Write at least 40 characters'),
  pros: z.string().trim().max(5000).optional().or(z.literal('')),
  cons: z.string().trim().max(5000).optional().or(z.literal('')),
  isAnonymous: z.boolean(),
});

export type ReviewForm = z.infer<typeof reviewSchema>;

export const updateSchema = z
  .object({
    type: z.string().min(1, 'Choose an update type'),
    title: z.string().trim().max(255).optional().or(z.literal('')),
    body: z.string().trim().min(1, 'Write something to post'),
    links: z.string().optional().or(z.literal('')),
    status: z.enum(['draft', 'scheduled', 'published', 'archived']),
    scheduledAt: z.string().optional().or(z.literal('')),
  })
  .refine((value) => value.status !== 'scheduled' || !!value.scheduledAt, {
    message: 'Choose when this should publish',
    path: ['scheduledAt'],
  });

export type UpdateForm = z.infer<typeof updateSchema>;

// ---------------------------------------------------------------------------
// Asset validation
// ---------------------------------------------------------------------------
//
// The company module stores links to images and documents, not the bytes: every
// branding and verification field on the wire is a URL. These mirror the checks
// `validateAssetURL` in the Go service applies, so a link the server will reject
// is caught in the form instead of coming back as a 400.

export interface AssetValidationResult {
  valid: boolean;
  error?: string;
}

export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

/** The path, with any query string or fragment removed. */
const pathOf = (url: string): string => {
  const trimmed = url.trim().toLowerCase();
  const cut = trimmed.search(/[?#]/);
  return cut === -1 ? trimmed : trimmed.slice(0, cut);
};

const validateAssetUrl = (
  url: string,
  extensions: string[],
  wrongTypeMessage: string
): AssetValidationResult => {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: 'Enter a link' };
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    return { valid: false, error: 'Links must start with http:// or https://' };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: 'That link is too long' };
  }
  if (!extensions.some((extension) => pathOf(trimmed).endsWith(extension))) {
    return { valid: false, error: wrongTypeMessage };
  }
  return { valid: true };
};

/** A logo or cover link. Matches the extensions the Go service accepts. */
export const validateImageUrl = (url: string): AssetValidationResult =>
  validateAssetUrl(url, ALLOWED_IMAGE_EXTENSIONS, 'Link to a PNG, JPEG, WebP, GIF or SVG image');

/** A verification document link. */
export const validateDocumentUrl = (url: string): AssetValidationResult =>
  validateAssetUrl(url, ALLOWED_DOCUMENT_EXTENSIONS, 'Link to a PDF, PNG or JPEG document');
