export interface WorkExperience {
  id?: string;
  company: string;
  jobTitle: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentJob?: boolean;
  description?: string;
  skillsUsed?: string[];
  achievements?: string;
}

export type WorkExperienceItem = WorkExperience;

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

export type EducationItem = Education;

export interface UserSkill {
  id?: string;
  name: string;
  proficiencyLevel?: string;
  endorsementsCount?: number;
}

export interface UserCertification {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface UserAchievement {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  issuer?: string;
}

export interface CareerPreferences {
  openToWork: boolean;
  openToRecruiters?: boolean;
  targetRoles: string[];
  preferredLocations: string[];
  availabilityStatus: string; // e.g. 'immediate', '1_month', '2_months', 'not_looking'
  preferredJobTypes?: string[];
  minSalary?: number;
  currency?: string;
}

export interface ProfileCompletenessItem {
  key: string;
  label: string;
  actionUrl: string;
  weight: number;
}

export interface ProfileCompleteness {
  percentage: number;
  missingSections: ProfileCompletenessItem[];
}

export interface TitleDiscrepancy {
  profileTitle: string;
  resumeTitle: string;
  discrepancy: string;
}

export interface ResumeConsistency {
  overallScore: number;
  missingSkills: string[];
  titleDiscrepancies: TitleDiscrepancy[];
  suggestions: string[];
}

export interface ProfileAnalytics {
  profileViews: number;
  searchAppearances: number;
  connectionRequests: number;
  weeklyViewTrend?: number[];
  topSearchKeywords?: string[];
}

export interface ProfilePrivacySettingsData {
  profileVisibility: 'public' | 'connections_only' | 'private';
  searchIndexing: boolean;
  contactPrivacy: 'everyone' | 'connections_only' | 'none';
  showEmail?: boolean;
  showPhone?: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string;
  coverUrl: string;
  headline: string;
  summary: string;
  location: string;
  country?: string;
  industry?: string;
  currentPosition?: string;
  availabilityStatus: string;
  openToWork: boolean;
  openToRecruiters?: boolean;
  targetRoles: string[];
  preferredLocations: string[];
  profileCompletedPercentage: number;
  volunteering?: string;
  publications?: string;
  licenses?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  isRestricted?: boolean;
  isPrivate?: boolean;
  profileViewsCount?: number;
  searchAppearancesCount?: number;
  connectionRequestsCount?: number;
  workExperiences?: WorkExperience[];
  educations?: Education[];
  skills?: UserSkill[];
  certifications?: UserCertification[];
  projects?: any[];
  languages?: any[];
  achievements?: UserAchievement[];
  careerPreferences?: CareerPreferences;
  profileCompleteness?: ProfileCompleteness;
  resumeConsistency?: ResumeConsistency;
  profileAnalytics?: ProfileAnalytics;
  privacySettings?: ProfilePrivacySettingsData;
}

export type ProfileData = UserProfile;
