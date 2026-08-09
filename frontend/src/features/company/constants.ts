/**
 * Option lists for the company forms and filters.
 *
 * These are suggestions, not a closed vocabulary: the backend stores industry,
 * type and size as free text, so every control that uses them accepts a typed
 * value too. Keeping the suggested industries aligned with the existing
 * `/companies` directory filters means the two screens agree on their spelling.
 */

export const COMPANY_INDUSTRIES = [
  'Technology',
  'Facilities Management & Real Estate',
  'Healthcare',
  'Aviation & Logistics',
  'Oil & Gas',
  'Finance & Banking',
  'Education',
  'Retail & E-commerce',
  'Manufacturing',
  'Construction',
  'Hospitality & Tourism',
  'Media & Entertainment',
  'Professional Services',
  'Government & Public Sector',
  'Non-profit',
];

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+',
];

export const COMPANY_TYPES = [
  'Public Company',
  'Privately Held',
  'Startup',
  'Government Agency',
  'Non-profit',
  'Educational Institution',
  'Partnership',
  'Sole Proprietorship',
];

export const COMPANY_SORTS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'followers', label: 'Most followed' },
  { value: 'jobs', label: 'Most open jobs' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name (A–Z)' },
];

export const VERIFICATION_DOCUMENT_TYPES = [
  { value: 'certificate_of_incorporation', label: 'Certificate of incorporation' },
  { value: 'trade_license', label: 'Trade licence' },
  { value: 'tax_registration', label: 'Tax registration' },
  { value: 'proof_of_address', label: 'Proof of business address' },
  { value: 'authorisation_letter', label: 'Authorisation letter' },
  { value: 'other', label: 'Other supporting document' },
];
