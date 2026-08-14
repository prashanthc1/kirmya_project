export type SearchCategory =
  | 'all'
  | 'people'
  | 'jobs'
  | 'companies'
  | 'communities'
  | 'courses'
  | 'events';

export interface SearchResultItem {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle: string;
  description: string;
  avatar_url?: string;
  url: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  category: SearchCategory;
  total_results: number;
  engine_used: string;
  results: SearchResultItem[];
  categories_counts?: Record<string, number>;
}

export interface SearchSuggestion {
  text: string;
  category: SearchCategory;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  query: string;
  category_filter: string;
  results_count: number;
  searched_at: string;
}

export interface SaveSearchPreferencePayload {
  saved_query: string;
  filters?: Record<string, any>;
  email_alert_enabled?: boolean;
}

export interface SearchFilterParams {
  location?: string;
  workArrangement?: string;
  employmentType?: string;
  experienceLevel?: string;
  industry?: string;
  skills?: string[];
  category?: SearchCategory;
  minSalary?: number;
  maxSalary?: number;
  [key: string]: any;
}

export interface ReindexPayload {
  entity_type?: string;
  entity_id?: string;
  full_reindex?: boolean;
}

export interface RecentSearchDeletePayload {
  id?: string;
  clear_all?: boolean;
}
