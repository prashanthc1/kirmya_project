export interface RecommendationItem {
  item_id: string;
  item_type: 'job' | 'person' | 'community' | 'course' | 'event' | 'candidate' | 'talent_pool';
  title: string;
  subtitle: string;
  description: string;
  category_tag: string;
  match_score: number;
  match_rationale: string;
  feature_vector: number[];
  metadata?: Record<string, any>;
}

export interface UnifiedRecommendationsResponse {
  jobs: RecommendationItem[];
  people: RecommendationItem[];
  communities: RecommendationItem[];
  courses: RecommendationItem[];
  events: RecommendationItem[];
  candidates: RecommendationItem[];
  talent_pools: RecommendationItem[];
}

export interface UserPreference {
  id: string;
  user_id: string;
  preferred_skills: string[];
  preferred_locations: string[];
  disliked_items: string[];
  feature_vector: number[];
  updated_at: string;
}

export interface TrackEventPayload {
  item_type: string;
  item_id: string;
  action: 'view' | 'click' | 'apply' | 'dismiss' | 'save';
}
