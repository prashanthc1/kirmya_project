export interface CoverLetterSection {
  id: string;
  coverLetterId: string;
  sectionType: 'header' | 'greeting' | 'introduction' | 'body' | 'achievements' | 'closing' | 'signature';
  content: string;
  sortOrder: number;
}

export interface CoverLetter {
  id: string;
  userId: string;
  name: string;
  jobId?: string;
  companyName: string;
  jobTitle: string;
  recipientName: string;
  recipientTitle: string;
  jobReferenceNumber: string;
  location: string;
  date: string;
  openingGreeting: string;
  introduction: string;
  body: string;
  closing: string;
  signature: string;
  fullContent: string;
  templateName: string;
  tone: 'Professional' | 'Confident' | 'Executive' | 'Friendly' | 'Concise' | 'Enthusiastic' | 'Technical';
  targetLength: 'Short' | 'Standard' | 'Detailed';
  isAiGenerated: boolean;
  isJobSpecific: boolean;
  wordCount: number;
  characterCount: number;
  jobMatchScore: number;
  createdAt: string;
  updatedAt: string;
  sections?: CoverLetterSection[];
}

export interface CoverLetterVersion {
  id: string;
  coverLetterId: string;
  versionTag: string;
  contentSnapshot: string;
  wordCount: number;
  createdBy: string;
  createdAt: string;
}

export interface CoverLetterTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  recommendedUse: string;
  thumbnailUrl: string;
  createdAt?: string;
}

export interface CoverLetterShare {
  id: string;
  coverLetterId: string;
  userId: string;
  shareToken: string;
  privacyLevel: 'Public' | 'Recruiters Only' | 'Connections Only' | 'Private';
  shareUrl: string;
  qrCodeUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface CoverLetterAnalytics {
  coverLetterId: string;
  userId: string;
  totalViews: number;
  recruiterViews: number;
  totalDownloads: number;
  applicationsUsedCount: number;
  avgMatchScore: number;
  updatedAt: string;
}

export interface GenerateCoverLetterRequest {
  jobId?: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  tone?: string;
  length?: string;
}

export interface RewriteRequest {
  content: string;
  instruction: string;
  tone?: string;
  targetLength?: string;
}

export interface TailorJobResponse {
  matchScore: number;
  relevantSkills: string[];
  relevantExperience: string[];
  relevantAchievements: string[];
  recommendedTalkingPoints: string[];
  suggestedCoverLetterId?: string;
}
