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

export interface CandidateNote {
  id: string;
  candidateId: string;
  recruiterId: string;
  recruiterName: string;
  note: string;
  score: number;
  recommendation: string;
  isPinned: boolean;
  createdAt: string;
}

export interface CandidateEvaluation {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  evaluatorId: string;
  evaluatorName: string;
  skillsScore: number;
  experienceScore: number;
  communicationScore: number;
  technicalScore: number;
  cultureFitScore: number;
  roleFitScore: number;
  overallScore: number;
  recommendation: string;
  strengths: string;
  weaknesses: string;
  notes: string;
  createdAt: string;
}

export interface StageHistoryItem {
  id: string;
  applicationId: string;
  fromStage: string;
  toStage: string;
  movedBy: string;
  movedByName: string;
  notes: string;
  movedAt: string;
}

export interface ApplicationDetail {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateHeadline: string;
  candidateAvatar: string;
  candidateLocation: string;
  experienceYears: number;
  skills: string[];
  aiMatchScore: number;
  currentStage: string;
  recruiterId: string;
  assignedRecruiter: string;
  rating: number;
  coverLetter: string;
  resumeUrl: string;
  appliedAt: string;
  updatedAt: string;
}

export interface JobOffer {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  positionTitle: string;
  salary: string;
  currency: string;
  benefits: string;
  joiningDate: string;
  contractType: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export interface BulkActionPayload {
  application_ids: string[];
  action: 'move' | 'reject' | 'shortlist' | 'assign' | 'tag' | 'message';
  target_stage?: string;
  assignee_id?: string;
  tag_id?: string;
  message_text?: string;
  notes?: string;
}
