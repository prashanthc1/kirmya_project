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
}
