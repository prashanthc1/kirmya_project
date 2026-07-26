package domain

import (
	"time"

	"github.com/google/uuid"
)

type ResumeScores struct {
	ID                    uuid.UUID `json:"id"`
	AnalysisID            uuid.UUID `json:"analysis_id"`
	OverallScore          int       `json:"overall_score"`          // 0-100
	ATSCompatibilityScore int       `json:"ats_compatibility_score"` // 0-100
	StructureScore        int       `json:"structure_score"`
	SkillsScore           int       `json:"skills_score"`
	ExperienceScore       int       `json:"experience_score"`
	JobMatchScore         int       `json:"job_match_score"`
	CreatedAt             time.Time `json:"created_at"`
}

type ImprovementHistory struct {
	ID                    uuid.UUID `json:"id"`
	AnalysisID            uuid.UUID `json:"analysis_id"`
	UserID                uuid.UUID `json:"user_id"`
	MissingSkills         []string  `json:"missing_skills"`
	PresentKeywords       []string  `json:"present_keywords"`
	MissingKeywords       []string  `json:"missing_keywords"`
	KeywordDensityScore   int       `json:"keyword_density_score"`
	StructureFeedback     []string  `json:"structure_feedback"`
	ExperienceBulletFixes []string  `json:"experience_bullet_fixes"`
	GeneralSuggestions    []string  `json:"general_suggestions"`
	CreatedAt             time.Time `json:"created_at"`
}

type ResumeAnalysis struct {
	ID                   uuid.UUID           `json:"id"`
	UserID               uuid.UUID           `json:"user_id"`
	TargetJobTitle       string              `json:"target_job_title"`
	TargetJobDescription string              `json:"target_job_description"`
	ResumeText           string              `json:"resume_text"`
	Status               string              `json:"status"`
	CreatedAt            time.Time           `json:"created_at"`
	Scores               *ResumeScores       `json:"scores,omitempty"`
	Improvements         *ImprovementHistory `json:"improvements,omitempty"`
}

type AnalyzeResumePayload struct {
	ResumeText           string `json:"resume_text" binding:"required"`
	TargetJobTitle       string `json:"target_job_title" binding:"required"`
	TargetJobDescription string `json:"target_job_description"`
}
