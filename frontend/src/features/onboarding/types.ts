export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: number;
  completed_steps: number[];
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileCompletion {
  id: string;
  user_id: string;
  completion_score: number;
  resume_score: number;
  skill_score: number;
  market_demand_score: number;
  ai_insights: {
    missing_skills?: string[];
    market_demand?: string;
    recommended_certifications?: string[];
    improvement_recommendations?: string[];
  };
  updated_at?: string;
}

export interface PersonalInfoFormData {
  firstName: string;
  lastName: string;
  headline: string;
  professionalSummary: string;
  currentLocation: string;
  country: string;
  nationality: string;
  phoneNumber: string;
  timezone: string;
  languages: string[];
}

export interface ProfessionalDetailsFormData {
  employmentStatus: string;
  currentJobTitle: string;
  yearsExperience: number;
  industry: string;
  department: string;
  employmentType: string;
  expectedSalary: string;
  preferredCurrency: string;
  noticePeriod: string;
  preferredWorkMode: string;
}

export interface SkillItem {
  id?: string;
  name: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface WorkExperienceItem {
  id?: string;
  company: string;
  jobTitle: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  responsibilities: string;
  achievements: string;
}

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface CertificationItem {
  id?: string;
  certificationName: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialID: string;
  credentialURL: string;
}

export interface ResumeParsedResult {
  file_name: string;
  skills: string[];
  work_experiences: WorkExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
}

export interface CareerPreferencesData {
  desiredJobTitles: string[];
  preferredIndustries: string[];
  preferredCountries: string[];
  preferredCities: string[];
  remotePreference: string;
  employmentTypes: string[];
  expectedSalary: string;
  preferredCurrency: string;
  preferredCompanySize: string;
  travelWillingness: string;
  visaSponsorshipRequired: boolean;
}

export interface JobAlertPreferencesData {
  frequency: 'Instant' | 'Daily' | 'Weekly' | 'Monthly';
  notificationMethods: ('Email' | 'Push' | 'In-app' | 'SMS')[];
}

export interface CommunityRecommendation {
  id: string;
  name: string;
  category: string;
  member_count: number;
  is_joined: boolean;
}

export interface ConnectionRecommendation {
  id: string;
  name: string;
  title: string;
  company: string;
  role_type: 'Recruiter' | 'Company' | 'Mentor' | 'Expert';
  avatar_url: string;
  is_connected: boolean;
}
