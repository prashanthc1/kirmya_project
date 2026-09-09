import type { ApplicationStage } from '../recruiter/stages';

/**
 * The stages an application can hold, as the API defines them.
 *
 * This union listed "Screening", "Recruiter Review", "Technical Round",
 * "Final Interview" and "Hired" - five values the server never writes and its
 * transition table refuses - while omitting "Viewed" and "Accepted", which it
 * does. It is derived from the one canonical list now, so a stage cannot be
 * offered in the UI that the API would reject.
 */
export type ATSStage = ApplicationStage;

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
