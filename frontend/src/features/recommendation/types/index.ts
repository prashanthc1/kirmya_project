export interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMax: number;
  salaryMin?: number;
  currency: string;
  industry: string;
  requiredSkills: string[];
  employmentType?: string;
  experienceLevel?: string;
  workplaceType?: string;
}

export interface JobRecommendation {
  id: string;
  userId: string;
  jobId: string;
  matchScore: number;
  matchReasons: string;
  isActive: boolean;
  jobDetails?: JobDetails;
}

export interface UserJobPreferences {
  preferredTitles: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  minSalary: number;
  currency: string;
  remoteOnly?: boolean;
}

export interface RecommendedPerson {
  userId: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  location: string;
  industry: string;
  mutualCount: number;
  sharedSkills: string[];
  matchScore: number;
  reason: string;
}

export interface RecommendedCommunity {
  communityId: string;
  name: string;
  description: string;
  slug: string;
  category: string;
  iconUrl?: string;
  memberCount: number;
  isPrivate: boolean;
  matchScore: number;
  reason: string;
}

export interface CareerTipItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: number;
}

export type FeedItemType = 'job' | 'person' | 'community' | 'career_tip';

export interface FeedItem {
  id: string;
  itemType: FeedItemType;
  score: number;
  rationale: string;
  timestamp: string;
  job?: JobDetails;
  person?: RecommendedPerson;
  community?: RecommendedCommunity;
  tip?: CareerTipItem;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount: number;
}
