package domain

import (
	"time"

	"github.com/google/uuid"
)

// Course Categories
const (
	CategoryTechnology        = "Technology"
	CategoryManagement        = "Management"
	CategorySoftSkills        = "Soft skills"
	CategoryInterviewPrep     = "Interview preparation"
	CategoryCertifications    = "Industry certifications"
)

// Course Providers
const (
	ProviderKirmya     = "kirmya"
	ProviderCoursera   = "coursera"
	ProviderUdemy      = "udemy"
	ProviderPluralsight = "pluralsight"
)

// Progress Statuses
const (
	StatusEnrolled   = "enrolled"
	StatusInProgress = "in_progress"
	StatusCompleted  = "completed"
)

type Course struct {
	ID               uuid.UUID `json:"id"`
	Title            string    `json:"title"`
	Description      string    `json:"description"`
	Category         string    `json:"category"`
	DifficultyLevel  string    `json:"difficulty_level"`
	Provider         string    `json:"provider"`
	ExternalCourseID string    `json:"external_course_id,omitempty"`
	ExternalURL      string    `json:"external_url,omitempty"`
	ThumbnailURL     string    `json:"thumbnail_url,omitempty"`
	DurationHours    int       `json:"duration_hours"`
	TotalLessons     int       `json:"total_lessons"`
	Rating           float64   `json:"rating"`
	SkillsCovered    []string  `json:"skills_covered"`
	CreatedAt        time.Time `json:"created_at"`
}

type LearningPath struct {
	ID             uuid.UUID   `json:"id"`
	Title          string      `json:"title"`
	Description    string      `json:"description"`
	TargetRole     string      `json:"target_role"`
	Category       string      `json:"category"`
	EstimatedWeeks int         `json:"estimated_weeks"`
	CourseIDs      []uuid.UUID `json:"course_ids"`
	Courses        []Course    `json:"courses,omitempty"`
	BadgeName      string      `json:"badge_name"`
	CreatedAt      time.Time   `json:"created_at"`
}

type UserLearningProgress struct {
	ID                   uuid.UUID  `json:"id"`
	UserID               uuid.UUID  `json:"user_id"`
	CourseID             uuid.UUID  `json:"course_id"`
	CourseTitle          string     `json:"course_title,omitempty"`
	LearningPathID       *uuid.UUID `json:"learning_path_id,omitempty"`
	Status               string     `json:"status"`
	CompletedLessons     int        `json:"completed_lessons"`
	TotalLessons         int        `json:"total_lessons"`
	CompletionPercentage int        `json:"completion_percentage"`
	TimeSpentMinutes     int        `json:"time_spent_minutes"`
	LastAccessedAt       time.Time  `json:"last_accessed_at"`
	CreatedAt            time.Time  `json:"created_at"`
}

type Certificate struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"user_id"`
	UserName         string     `json:"user_name"`
	CourseID         *uuid.UUID `json:"course_id,omitempty"`
	LearningPathID   *uuid.UUID `json:"learning_path_id,omitempty"`
	Title            string     `json:"title"`
	VerificationCode string     `json:"verification_code"`
	SkillsMastered   []string   `json:"skills_mastered"`
	IssueDate        time.Time  `json:"issue_date"`
}

type SkillAssessment struct {
	ID                 uuid.UUID  `json:"id"`
	UserID             uuid.UUID  `json:"user_id"`
	Domain             string     `json:"domain"`
	Score              int        `json:"score"`
	ReadinessLevel     string     `json:"readiness_level"`
	RecommendedPathID *uuid.UUID `json:"recommended_path_id,omitempty"`
	AnswersJSON        string     `json:"answers_json,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
}

type SubmitAssessmentRequest struct {
	Domain  string         `json:"domain" binding:"required"`
	Answers map[string]int `json:"answers" binding:"required"` // question_id -> rating (1-5)
}

type UpdateProgressRequest struct {
	CourseID         uuid.UUID `json:"course_id" binding:"required"`
	CompletedLessons int       `json:"completed_lessons" binding:"required"`
	TimeSpentMinutes int       `json:"time_spent_minutes"`
}
