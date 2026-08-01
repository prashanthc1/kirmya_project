export type ATSStage =
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Recruiter Review'
  | 'Interview'
  | 'Technical Round'
  | 'Final Interview'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export interface JobApplicationDTO {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateHeadline: string;
  candidateAvatar?: string;
  candidateLocation: string;
  experienceYears: number;
  skills: string[];
  aiMatchScore: number;
  currentStage: ATSStage;
  recruiterId: string;
  assignedRecruiter: string;
  rating: number;
  appliedAt: string;
  updatedAt: string;
}

export interface ApplicationStageHistoryDTO {
  id: string;
  applicationId: string;
  fromStage: string;
  toStage: string;
  movedBy: string;
  movedByName: string;
  notes: string;
  movedAt: string;
}

export interface InterviewFeedbackDTO {
  id: string;
  interviewId: string;
  applicationId: string;
  interviewerId: string;
  interviewerName: string;
  overallRating: number;
  technicalScore: number;
  communicationScore: number;
  experienceScore: number;
  cultureFitScore: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
  notes: string;
  createdAt: string;
}

export interface JobOfferDTO {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  recruiterId: string;
  positionTitle: string;
  salary: string;
  currency: string;
  benefits: string;
  joiningDate: string;
  contractType: string;
  status: 'Draft' | 'Approval' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  createdAt: string;
  expiresAt: string;
}

export interface AIEvaluationResponse {
  applicationId: string;
  candidateName: string;
  overallMatchScore: number;
  recommendation: 'Hire' | 'Consider' | 'Reject';
  summaryOverview: string;
  skillGaps: string[];
  strengths: string[];
  riskFactors: string[];
  suggestedQuestions: string[];
}
