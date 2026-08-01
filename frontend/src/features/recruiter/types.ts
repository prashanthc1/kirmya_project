export interface RecruiterJob {
  id: string;
  recruiterId?: string;
  title: string;
  description: string;
  department: string;
  location: string;
  salaryRange: string;
  employmentType: string;
  status: 'Active' | 'Paused' | 'Closed' | 'Draft';
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
  stage: 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Technical Round' | 'Final Interview' | 'Offer' | 'Hired' | 'Rejected';
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
  totalApplicantsCount: number;
  newCandidatesCount: number;
  interviewsScheduled: number;
  pendingReviewsCount: number;
  offersSentCount: number;
  successfulHiresCount: number;
  recentJobs: RecruiterJob[];
  upcomingInterviews: InterviewItem[];
  recentActivities: { id: string; activityType: string; description: string; createdAt: string }[];
}

export interface RecruiterAnalytics {
  totalJobsActive: number;
  totalCandidatesCount: number;
  stageDistribution: { [key: string]: number };
  applicationTrends: { month: string; applications: number }[];
  candidateSources: { source: string; percentage: number }[];
  timeToHireDays: number;
}
