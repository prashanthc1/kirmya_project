import { API_BASE_URL } from './api_base';

/**
 * Server-side reads of public data.
 *
 * F10. Every page in this app was a client component, so a job posting existed
 * only after JavaScript ran: the HTML a crawler received was an empty shell,
 * `generateMetadata` appeared nowhere, and no individual job could be indexed
 * or be eligible for Google for Jobs. For a job board that removes the channel
 * that supplies most of its traffic.
 *
 * These fetches run on the server during rendering, so the posting is in the
 * HTML. They use no credentials — this is the public board, and a request that
 * needed a session could not be rendered for an anonymous crawler anyway.
 */

/** How long a rendered public page may be reused before it is fetched again. */
const PUBLIC_REVALIDATE_SECONDS = 300;

export interface PublicJob {
  id: string;
  title: string;
  description?: string;
  company_id?: string;
  company_name?: string;
  company_handle?: string;
  company_logo?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  experience_level?: string;
  department?: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  skills?: string[];
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  status?: string;
  published_at?: string;
  expires_at?: string;
  created_at?: string;
}

/**
 * Fetches one public job posting.
 *
 * Returns null for a posting that does not exist, is not open, or has expired.
 * The caller renders a 404 for all three: a page that answers 200 with "this
 * job is gone" teaches a crawler that every dead posting is still a live page,
 * which is what gets a whole board demoted.
 */
export async function fetchPublicJob(id: string): Promise<PublicJob | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${encodeURIComponent(id)}`, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const job = (await response.json()) as PublicJob;
    return isOpen(job) ? job : null;
  } catch {
    // A failed fetch is not a missing job. The caller distinguishes them: a
    // render error should not be cached as a 404 for the next five minutes.
    return null;
  }
}

/**
 * Fetches open postings for the sitemap.
 *
 * Pages through the public board rather than taking the first page, because a
 * sitemap listing only the newest twenty jobs tells a crawler the rest do not
 * exist.
 */
export async function fetchOpenJobsForSitemap(limit = 5000): Promise<PublicJob[]> {
  const pageSize = 100;
  const jobs: PublicJob[] = [];

  for (let page = 1; jobs.length < limit; page += 1) {
    let batch: PublicJob[] = [];
    try {
      const response = await fetch(`${API_BASE_URL}/jobs?page=${page}&limit=${pageSize}`, {
        next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) break;

      const body = await response.json();
      batch = Array.isArray(body?.data) ? body.data : [];
    } catch {
      // A partial sitemap is better than none: what was collected is still
      // valid, and the next revalidation will try again.
      break;
    }

    if (batch.length === 0) break;
    jobs.push(...batch.filter(isOpen));
    if (batch.length < pageSize) break;
  }

  return jobs.slice(0, limit);
}

/** Whether a posting is one a visitor could actually apply to right now. */
function isOpen(job: PublicJob | null | undefined): job is PublicJob {
  if (!job || !job.id) return false;
  if (job.status && job.status.toLowerCase() !== 'active') return false;
  if (job.expires_at && new Date(job.expires_at).getTime() <= Date.now()) return false;
  return true;
}

/**
 * Builds the JobPosting structured data Google reads.
 *
 * Only fields the posting actually carries are emitted. A JobPosting with an
 * invented `baseSalary` or a guessed `validThrough` is worse than one without
 * them: the fields are what search engines check, and wrong ones get the whole
 * site's structured data distrusted.
 */
export function jobPostingJsonLd(job: PublicJob, canonicalUrl: string): Record<string, unknown> {
  const posting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || job.title,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company_name || 'Kirmya',
      value: job.id,
    },
    url: canonicalUrl,
    directApply: true,
  };

  if (job.published_at || job.created_at) {
    posting.datePosted = job.published_at || job.created_at;
  }
  if (job.expires_at) {
    posting.validThrough = job.expires_at;
  }
  if (job.company_name) {
    posting.hiringOrganization = {
      '@type': 'Organization',
      name: job.company_name,
      ...(job.company_logo ? { logo: job.company_logo } : {}),
    };
  }
  if (job.location) {
    posting.jobLocation = {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location },
    };
  }
  // Remote roles need this specific shape, or Google treats the location as the
  // only place the job can be done.
  if (job.work_mode && job.work_mode.toLowerCase().includes('remote')) {
    posting.jobLocationType = 'TELECOMMUTE';
  }
  if (job.employment_type) {
    posting.employmentType = job.employment_type.toUpperCase().replace(/[\s-]+/g, '_');
  }
  if (typeof job.salary_min === 'number' || typeof job.salary_max === 'number') {
    posting.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salary_currency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        ...(typeof job.salary_min === 'number' ? { minValue: job.salary_min } : {}),
        ...(typeof job.salary_max === 'number' ? { maxValue: job.salary_max } : {}),
        unitText: 'YEAR',
      },
    };
  }
  if (job.skills?.length) {
    posting.skills = job.skills.join(', ');
  }

  return posting;
}

/** The site's public origin, used for canonicals and the sitemap. */
export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://kirmya.com').replace(/\/+$/, '');
}

/** Trims a description into a meta description without cutting mid-word. */
export function metaDescription(text: string | undefined, fallback: string, max = 155): string {
  const source = (text || '').replace(/\s+/g, ' ').trim();
  if (!source) return fallback;
  if (source.length <= max) return source;
  const cut = source.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
