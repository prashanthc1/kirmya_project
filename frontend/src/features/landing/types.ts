export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  company_name: string;
  avatar_url: string;
  quote: string;
  achievement: string;
  rating: number;
  is_featured: boolean;
  created_at: string;
}

export interface FeaturedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  match_percentage: number;
  salary_range: string;
  tags: string[];
  created_at: string;
}

export interface FeaturedCompany {
  id: string;
  name: string;
  logo_url: string;
  open_positions: number;
  industry: string;
  location: string;
  created_at: string;
}

export interface LandingStatistic {
  id: string;
  stat_key: string;
  stat_value: string;
  stat_label: string;
  display_order: number;
}

export interface LandingContentResponse {
  statistics: LandingStatistic[];
  featured_jobs: FeaturedJob[];
  featured_companies: FeaturedCompany[];
  testimonials: Testimonial[];
  /** Absent when no true figures could be counted. */
  platform_statistics?: PlatformStatistics;
}

/**
 * Counted platform figures.
 *
 * Every field is an integer counted from real rows at request time. It is
 * optional on the response because "we cannot count this right now" is a real
 * answer — the statistics band renders only when the figures are present,
 * rather than falling back to a hardcoded number as it used to.
 */
export interface PlatformStatistics {
  open_jobs: number;
  hiring_companies: number;
  members: number;
  applications_submitted: number;
}
