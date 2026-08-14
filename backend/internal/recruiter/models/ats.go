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
	CoverLetter        string    `json:"coverLetter"`
	ResumeURL          string    `json:"resumeUrl"`
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
	InterviewID          string `json:"interview_id" binding:"required"`
	ApplicationID        string `json:"application_id" binding:"required"`
	TechnicalSkillsScore int    `json:"technical_skills_score"`
	CommunicationScore   int    `json:"communication_score"`
	ProblemSolvingScore  int    `json:"problem_solving_score"`
	CultureFitScore      int    `json:"culture_fit_score"`
	LeadershipScore      int    `json:"leadership_score"`
	OverallRating        int    `json:"overall_rating"`
	Recommendation       string `json:"recommendation" binding:"required"` // 'Strong Hire', 'Hire', 'Maybe', 'No Hire'
	Comments             string `json:"comments"`
}

type InterviewFeedbackDTO struct {
	ID                   uuid.UUID `json:"id"`
	InterviewID          uuid.UUID `json:"interviewId"`
	ApplicationID        uuid.UUID `json:"applicationId"`
	InterviewerID        uuid.UUID `json:"interviewerId"`
	InterviewerName      string    `json:"interviewerName"`
	TechnicalSkillsScore int       `json:"technicalSkillsScore"`
	CommunicationScore   int       `json:"communicationScore"`
	ProblemSolvingScore  int       `json:"problemSolvingScore"`
	CultureFitScore      int       `json:"cultureFitScore"`
	LeadershipScore      int       `json:"leadershipScore"`
	OverallRating        int       `json:"overallRating"`
	Recommendation       string    `json:"recommendation"`
	Comments             string    `json:"comments"`
	CreatedAt            time.Time `json:"createdAt"`
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
	Status        string    `json:"status"` // 'Draft', 'Prepared', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired', 'Withdrawn'
	CreatedAt     time.Time `json:"createdAt"`
	ExpiresAt     time.Time `json:"expiresAt"`
}

type ATSBulkActionPayload struct {
	ApplicationIDs []string `json:"application_ids" binding:"required"`
	Action         string   `json:"action" binding:"required"` // 'move', 'reject', 'shortlist', 'assign', 'tag', 'message'
	TargetStage    string   `json:"target_stage"`
	AssigneeID     string   `json:"assignee_id"`
	TagID          string   `json:"tag_id"`
	MessageText    string   `json:"message_text"`
	Notes          string   `json:"notes"`
}

type AIEvaluationResponse struct {
	ApplicationID       uuid.UUID `json:"applicationId"`
	CandidateName       string    `json:"candidateName"`
	OverallMatchScore   int       `json:"overallMatchScore"`
	Recommendation      string    `json:"recommendation"` // 'Hire', 'Consider', 'Reject'
	SummaryOverview     string    `json:"summaryOverview"`
	SkillGaps           []string  `json:"skillGaps"`
	Strengths           []string  `json:"strengths"`
	RiskFactors         []string  `json:"riskFactors"`
	SuggestedQuestions  []string  `json:"suggestedQuestions"`
}

// CandidateEvaluationPayload is the request for creating a candidate evaluation.
type CandidateEvaluationPayload struct {
	ApplicationID      string `json:"application_id" binding:"required"`
	JobID              string `json:"job_id" binding:"required"`
	CandidateID        string `json:"candidate_id" binding:"required"`
	SkillsScore        int    `json:"skills_score"`
	ExperienceScore    int    `json:"experience_score"`
	CommunicationScore int    `json:"communication_score"`
	TechnicalScore     int    `json:"technical_score"`
	CultureFitScore    int    `json:"culture_fit_score"`
	RoleFitScore       int    `json:"role_fit_score"`
	OverallScore       int    `json:"overall_score"`
	Recommendation     string `json:"recommendation"`
	Strengths          string `json:"strengths"`
	Weaknesses         string `json:"weaknesses"`
	Notes              string `json:"notes"`
}

// CandidateEvaluationDTO is the response for a candidate evaluation.
type CandidateEvaluationDTO struct {
	ID                 uuid.UUID `json:"id"`
	ApplicationID      uuid.UUID `json:"applicationId"`
	JobID              uuid.UUID `json:"jobId"`
	CandidateID        uuid.UUID `json:"candidateId"`
	EvaluatorID        uuid.UUID `json:"evaluatorId"`
	EvaluatorName      string    `json:"evaluatorName"`
	OrgID              uuid.UUID `json:"orgId"`
	SkillsScore        int       `json:"skillsScore"`
	ExperienceScore    int       `json:"experienceScore"`
	CommunicationScore int       `json:"communicationScore"`
	TechnicalScore     int       `json:"technicalScore"`
	CultureFitScore    int       `json:"cultureFitScore"`
	RoleFitScore       int       `json:"roleFitScore"`
	OverallScore       int       `json:"overallScore"`
	Recommendation     string    `json:"recommendation"`
	Strengths          string    `json:"strengths"`
	Weaknesses         string    `json:"weaknesses"`
	Notes              string    `json:"notes"`
	CreatedAt          time.Time `json:"createdAt"`
}

// CreateNotePayload is the request for creating a recruiter note on a candidate.
type CreateNotePayload struct {
	Note           string `json:"note" binding:"required"`
	ApplicationID  string `json:"application_id"`
	Score          int    `json:"score"`
	Recommendation string `json:"recommendation"`
	IsPinned       bool   `json:"is_pinned"`
}
