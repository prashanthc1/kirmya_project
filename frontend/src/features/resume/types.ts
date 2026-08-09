export interface ResumeSection {
  id?: string;
  resumeId?: string;
  sectionType: string; // 'personal_info' | 'summary' | 'experience' | 'education' | 'skills' | 'certs' | 'projects' | 'achievements' | 'languages' | 'custom'
  content: string;
  sortOrder: number;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateName: string;
  isDefault: boolean;
  atsScore: number;
  completionPercentage: number;
  viewCount: number;
  downloadCount: number;
  applicationCount: number;
  fontFamily: string;
  fontSize: string;
  lineSpacing: string;
  pageMargins: string;
  paperSize: string;
  primaryColor: string;
  aiSuggestions: string;
  createdAt: string;
  updatedAt: string;
  sections?: ResumeSection[];
}

export interface ResumeVersion {
  id: string;
  resumeId: string;
  versionTag: string;
  contentSnapshot: string;
  atsScore: number;
  aiSuggestions: string;
  createdAt: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  recommendedFor: string;
  atsCompatibility: number;
  thumbnailUrl: string;
}

export interface ResumeShare {
  id: string;
  resumeId: string;
  userId: string;
  shareToken: string;
  privacyLevel: string;
  shareUrl: string;
  qrCodeUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface ResumeAnalytics {
  resumeId: string;
  userId: string;
  totalViews: number;
  recruiterViews: number;
  totalDownloads: number;
  applicationsUsedCount: number;
  avgMatchScore: number;
  updatedAt: string;
}

export interface ATSAnalysis {
  overallScore: number;
  keywordScore: number;
  experienceScore: number;
  formattingScore: number;
  skillsScore: number;
  parsingIssues: string[];
  recommendations: string[];
}

export interface TailorJobResponse {
  matchScore: number;
  missingKeywords: string[];
  missingSkills: string[];
  recommendedChanges: string[];
  tailoredResumeId?: string;
}

export interface PersonalInfoContent {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  country?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface ExperienceItem {
  company: string;
  jobTitle: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  skills: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface SkillItem {
  name: string;
  category: string; // Technical, Soft, Management, Industry
  proficiency: string; // Beginner, Intermediate, Advanced, Expert
}
