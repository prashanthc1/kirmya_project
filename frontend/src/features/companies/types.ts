export interface Company {
  id: string;
  name: string;
  handle: string;
  createdAt?: string;
}

export interface CompanyProfile {
  companyId: string;
  logoUrl?: string;
  coverUrl?: string;
  about: string;
  industry: string;
  companySize: string;
  location: string;
  website: string;
  foundedYear: number;
  culture: string;
  benefits: string[];
  employeeInsights: string;
  followersCount: number;
  openJobsCount: number;
  isVerified: boolean;
  isHiring: boolean;
  isFollowing?: boolean;
  isSaved?: boolean;
  updatedAt?: string;
}

export interface CompanyDirectoryItem {
  company: Company;
  profile: CompanyProfile;
}

export interface CompanyDirectoryResponse {
  companies: CompanyDirectoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompanyFilterQuery {
  query?: string;
  industry?: string;
  size?: string;
  country?: string;
  city?: string;
  actively_hiring?: boolean;
  verified?: boolean;
  sort?: 'most_relevant' | 'most_jobs' | 'newest' | 'alphabetical' | 'followers';
  page?: number;
  limit?: number;
}

export interface IndustryCategory {
  id: string;
  name: string;
  icon: string;
  companyCount: number;
  openJobs: number;
}
