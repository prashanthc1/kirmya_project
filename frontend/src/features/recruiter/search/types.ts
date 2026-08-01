export interface AIMatchBreakdown {
  overallScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceAlignment: string;
  locationCompatibility: string;
  salaryAlignment: string;
  summaryNote: string;
}

export interface CandidateSearchResultItem {
  id: string;
  userId: string;
  name: string;
  headline: string;
  currentPosition: string;
  company: string;
  location: string;
  yearsExperience: number;
  skills: string[];
  profileCompletion: number;
  aiMatch: AIMatchBreakdown;
  availability: string;
  openToWork: boolean;
  noticePeriod: string;
  expectedSalary: string;
  educationDegree: string;
  certifications: string[];
  avatarUrl?: string;
  resumeUrl: string;
  saved: boolean;
  contacted: boolean;
}

export interface CandidateSearchQuery {
  q?: string;
  booleanMode?: boolean;
  title?: string;
  industry?: string;
  experienceLevel?: string;
  minYearsExp?: number;
  maxYearsExp?: number;
  requiredSkills?: string[];
  optionalSkills?: string[];
  country?: string;
  city?: string;
  remote?: string;
  availability?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface CandidateSearchResponse {
  query: string;
  totalResults: number;
  page: number;
  limit: number;
  engineUsed: string;
  candidates: CandidateSearchResultItem[];
  facets: Record<string, Record<string, number>>;
}

export interface TalentPoolDTO {
  id: string;
  recruiter_id: string;
  name: string;
  description: string;
  shared_with_team: boolean;
  candidates_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedSearchDTO {
  id: string;
  recruiter_id: string;
  search_name: string;
  query: string;
  filters: Record<string, any>;
  alert_frequency: 'Daily' | 'Weekly' | 'Immediately' | 'Off';
  created_at: string;
}

export interface CandidateComparisonItem {
  candidate_id: string;
  name: string;
  headline: string;
  years_experience: number;
  skills: string[];
  education: string;
  certifications: string[];
  ai_match_score: number;
  expected_salary: string;
  availability: string;
  notice_period: string;
}
