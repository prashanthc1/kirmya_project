package models

import (
	"time"

	"github.com/google/uuid"
)

type JobApplicationDTO struct {
	ID                 uuid.UUID `json:"id"`
	JobID              uuid.UUID `json:"jobId"`
	JobTitle           string    `json:"jobTitle"`
	CandidateID        uuid.UUID `json:"candidateId"`
	CandidateName      string    `json:"candidateName"`
	CandidateEmail     string    `json:"candidateEmail"`
	CandidateHeadline  string    `json:"candidateHeadline"`
	CandidateAvatar    string    `json:"candidateAvatar"`
	CandidateLocation  string    `json:"candidateLocation"`
	ExperienceYears    int       `json:"experienceYears"`
	Skills             []string  `json:"skills"`
	AIMatchScore       int       `json:"aiMatchScore"`
	CurrentStage       string    `json:"currentStage"`
	RecruiterID        uuid.UUID `json:"recruiterId"`
	AssignedRecruiter  string    `json:"assignedRecruiter"`
	Rating             int       `json:"rating"`
	AppliedAt          time.Time `json:"appliedAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type ApplicationStageHistoryDTO struct {
	ID            uuid.UUID `json:"id"`
	ApplicationID uuid.UUID `json:"applicationId"`
	FromStage     string    `json:"fromStage"`
	ToStage       string    `json:"toStage"`
	MovedBy       uuid.UUID `json:"movedBy"`
	MovedByName   string    `json:"movedByName"`
	Notes         string    `json:"notes"`
	MovedAt       time.Time `json:"movedAt"`
}

type InterviewFeedbackPayload struct {
	InterviewID        string `json:"interview_id" binding:"required"`
	ApplicationID      string `json:"application_id" binding:"required"`
	OverallRating      int    `json:"overall_rating"`
	TechnicalScore     int    `json:"technical_score"`
	CommunicationScore int    `json:"communication_score"`
	ExperienceScore    int    `json:"experience_score"`
	CultureFitScore    int    `json:"culture_fit_score"`
	Recommendation     string `json:"recommendation" binding:"required"` // 'Strong Hire', 'Hire', 'Maybe', 'Reject'
	Notes              string `json:"notes"`
}

type InterviewFeedbackDTO struct {
	ID                 uuid.UUID `json:"id"`
	InterviewID        uuid.UUID `json:"interviewId"`
	ApplicationID      uuid.UUID `json:"applicationId"`
	InterviewerID      uuid.UUID `json:"interviewerId"`
	InterviewerName    string    `json:"interviewerName"`
	OverallRating      int       `json:"overallRating"`
	TechnicalScore     int       `json:"technicalScore"`
	CommunicationScore int       `json:"communicationScore"`
	ExperienceScore    int       `json:"experienceScore"`
	CultureFitScore    int       `json:"cultureFitScore"`
	Recommendation     string    `json:"recommendation"`
	Notes              string    `json:"notes"`
	CreatedAt          time.Time `json:"createdAt"`
}

type JobOfferPayload struct {
	ApplicationID string `json:"application_id" binding:"required"`
	JobID         string `json:"job_id" binding:"required"`
	CandidateID   string `json:"candidate_id" binding:"required"`
	PositionTitle string `json:"position_title" binding:"required"`
	Salary        string `json:"salary" binding:"required"`
	Currency      string `json:"currency"`
	Benefits      string `json:"benefits"`
	JoiningDate   string `json:"joining_date"`
	ContractType  string `json:"contract_type"`
}

type JobOfferDTO struct {
	ID            uuid.UUID `json:"id"`
	ApplicationID uuid.UUID `json:"applicationId"`
	JobID         uuid.UUID `json:"jobId"`
	CandidateID   uuid.UUID `json:"candidateId"`
	CandidateName string    `json:"candidateName"`
	RecruiterID   uuid.UUID `json:"recruiterId"`
	PositionTitle string    `json:"positionTitle"`
	Salary        string    `json:"salary"`
	Currency      string    `json:"currency"`
	Benefits      string    `json:"benefits"`
	JoiningDate   string    `json:"joiningDate"`
	ContractType  string    `json:"contractType"`
	Status        string    `json:"status"` // 'Draft', 'Approval', 'Sent', 'Accepted', 'Rejected', 'Expired'
	CreatedAt     time.Time `json:"createdAt"`
	ExpiresAt     time.Time `json:"expiresAt"`
}

type ATSBulkActionPayload struct {
	ApplicationIDs []string `json:"application_ids" binding:"required"`
	Action         string   `json:"action" binding:"required"` // 'move', 'reject', 'shortlist', 'assign'
	TargetStage    string   `json:"target_stage"`
	AssigneeID     string   `json:"assignee_id"`
	Notes          string   `json:"notes"`
}

type AIEvaluationResponse struct {
	ApplicationID     uuid.UUID `json:"applicationId"`
	CandidateName     string    `json:"candidateName"`
	OverallMatchScore int       `json:"overallMatchScore"`
	Recommendation    string    `json:"recommendation"` // 'Hire', 'Consider', 'Reject'
	SummaryOverview   string    `json:"summaryOverview"`
	SkillGaps         []string  `json:"skillGaps"`
	Strengths         []string  `json:"strengths"`
	RiskFactors       []string  `json:"riskFactors"`
	SuggestedQuestions []string `json:"suggestedQuestions"`
}
