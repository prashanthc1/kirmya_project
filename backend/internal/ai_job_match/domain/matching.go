package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	TierStrongMatch    = "strong_match"
	TierGoodMatch      = "good_match"
	TierPotentialMatch = "potential_match"

	FeedbackRelevant    = "relevant"
	FeedbackNotRelevant = "not_relevant"
	FeedbackApplied     = "applied"
	FeedbackDismissed   = "dismissed"
)

type RecommendedAction struct {
	Type        string `json:"type"` // 'course', 'certification', 'resume_tweak'
	Title       string `json:"title"`
	Description string `json:"description"`
	ActionURL   string `json:"action_url"`
}

type AIJobMatch struct {
	ID                 uuid.UUID           `json:"id"`
	UserID             uuid.UUID           `json:"user_id"`
	JobID              uuid.UUID           `json:"job_id"`
	JobTitle           string              `json:"job_title"`
	CompanyName        string              `json:"company_name"`
	OverallScore       int                 `json:"overall_score"` // 0 to 100
	MatchTier          string              `json:"match_tier"`
	Explanation        string              `json:"explanation"`
	MatchedSkills      []string            `json:"matched_skills"`
	MissingSkills      []string            `json:"missing_skills"`
	RecommendedActions []RecommendedAction `json:"recommended_actions"`
	CreatedAt          time.Time           `json:"created_at"`
	Breakdown          *MatchingScore      `json:"breakdown,omitempty"`
}

type MatchingScore struct {
	ID                uuid.UUID              `json:"id"`
	MatchID           uuid.UUID              `json:"match_id"`
	SkillsScore       int                    `json:"skills_score"`
	ExperienceScore   int                    `json:"experience_score"`
	GoalsScore        int                    `json:"goals_score"`
	LocationScore     int                    `json:"location_score"`
	SalaryScore       int                    `json:"salary_score"`
	LearningScore     int                    `json:"learning_score"`
	ApplicationsScore int                    `json:"applications_score"`
	FeatureVector     map[string]interface{} `json:"feature_vector"`
	CreatedAt         time.Time              `json:"created_at"`
}

type MatchingFeedback struct {
	ID           uuid.UUID `json:"id"`
	MatchID      uuid.UUID `json:"match_id"`
	UserID       uuid.UUID `json:"user_id"`
	FeedbackType string    `json:"feedback_type"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
}

type SubmitFeedbackPayload struct {
	FeedbackType string `json:"feedback_type" binding:"required"` // 'relevant', 'not_relevant', 'applied', 'dismissed'
	Notes        string `json:"notes"`
}

type CandidateProfile struct {
	UserID            uuid.UUID
	Skills            []string
	YearsExperience   int
	TargetRole        string
	PreferredLocation string
	IsRemotePreferred bool
	MinSalaryExpect   int
	CompletedCourses  []string
	AppliedJobIDs     []uuid.UUID
}

type JobRequirement struct {
	JobID           uuid.UUID
	JobTitle        string
	CompanyName     string
	RequiredSkills  []string
	MinExperience   int
	Location        string
	IsRemoteAllowed bool
	SalaryOffered   int
}
