export interface RecruiterJob {
  id: string;
  recruiterId?: string;
  title: string;
  description: string;
  department: string;
  location: string;
  salaryRange: string;
  employmentType: string;
  workplaceType?: string;
  currency?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  status: 'Active' | 'Paused' | 'Closed' | 'Draft' | 'Archived';
  applicantsCount: number;
  viewsCount: number;
  deadline: string;
  createdAt: string;
}

export interface CandidatePipelineItem {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  stage: string;
  notes: string;
  interviewScheduledAt?: string | null;
  updatedAt: string;
}

export interface RecruiterCandidateItem {
  id: string;
  name: string;
  headline: string;
  location: string;
  skills: string[];
  experienceYears: number;
  matchScore: number;
  availability: string;
  resumeUrl: string;
  saved: boolean;
  recommendationNote: string;
}

export interface InterviewItem {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  type: 'Video' | 'Phone' | 'In-person';
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  notes?: string;
}

export interface RecruiterDashboardOverview {
  activeJobsCount: number;
  draftJobsCount?: number;
  totalApplicantsCount: number;
  newCandidatesCount: number;
  shortlistedCount?: number;
  interviewsScheduled: number;
  pendingReviewsCount: number;
  offersSentCount: number;
  offersCount?: number;
  successfulHiresCount: number;
  expiringJobsCount?: number;
  recentJobs: RecruiterJob[];
  upcomingInterviews: InterviewItem[];
  recentActivities: { id: string; activityType: string; description: string; createdAt: string }[];
}

export interface RecruiterAnalytics {
  totalJobsActive: number;
  totalCandidatesCount: number;
  stageDistribution: { [key: string]: number };
  applicationTrends: { month?: string; date?: string; applications: number }[];
  candidateSources: { source: string; percentage?: number; count?: number }[];
  timeToHireDays: number;
}
