package models

import (
	"time"
)

// Status constants
const (
	RequestStatusPending   = "pending"
	RequestStatusAccepted  = "accepted"
	RequestStatusRejected  = "rejected"
	RequestStatusCancelled = "cancelled"

	MentorshipStatusActive     = "active"
	MentorshipStatusCompleted  = "completed"
	MentorshipStatusTerminated = "terminated"

	GoalStatusPending    = "pending"
	GoalStatusInProgress = "in_progress"
	GoalStatusCompleted  = "completed"
	GoalStatusCancelled  = "cancelled"

	SessionStatusScheduled   = "scheduled"
	SessionStatusCompleted   = "completed"
	SessionStatusCancelled   = "cancelled"
	SessionStatusRescheduled = "rescheduled"
)

// MentorProfile represents a mentor's public profile and settings.
type MentorProfile struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	Bio             string    `json:"bio"`
	JobTitle        string    `json:"job_title"`
	Company         string    `json:"company"`
	YearsExperience int       `json:"years_experience"`
	Expertise       []string  `json:"expertise"`
	Industries      []string  `json:"industries"`
	Languages       []string  `json:"languages"`
	HourlyRate      float64   `json:"hourly_rate"`
	MaxMentees      int       `json:"max_mentees"`
	CurrentMentees  int       `json:"current_mentees"`
	Rating          float64   `json:"rating"`
	TotalReviews    int       `json:"total_reviews"`
	IsAvailable     bool      `json:"is_available"`
	IsFeatured      bool      `json:"is_featured"`
	SessionTypes    []string  `json:"session_types"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// MentorshipRequest represents a mentee's application for mentorship with a mentor.
type MentorshipRequest struct {
	ID                string    `json:"id"`
	MenteeID          string    `json:"mentee_id"`
	MentorID          string    `json:"mentor_id"`
	Message           string    `json:"message"`
	Goals             []string  `json:"goals"`
	PreferredSchedule string    `json:"preferred_schedule"`
	Status            string    `json:"status"` // pending, accepted, rejected, cancelled
	ResponseMessage   string    `json:"response_message,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Mentorship represents an active or historic mentorship relationship.
type Mentorship struct {
	ID        string     `json:"id"`
	RequestID string     `json:"request_id"`
	MentorID  string     `json:"mentor_id"`
	MenteeID  string     `json:"mentee_id"`
	Status    string     `json:"status"` // active, completed, terminated
	StartDate time.Time  `json:"start_date"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// MentorshipGoal represents a milestone or goal within a mentorship relationship.
type MentorshipGoal struct {
	ID           string     `json:"id"`
	MentorshipID string     `json:"mentorship_id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	TargetDate   *time.Time `json:"target_date,omitempty"`
	Status       string     `json:"status"` // pending, in_progress, completed, cancelled
	Progress     int        `json:"progress"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// MentorshipSession represents a scheduled meeting or mentoring session.
type MentorshipSession struct {
	ID              string    `json:"id"`
	MentorshipID    string    `json:"mentorship_id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	ScheduledAt     time.Time `json:"scheduled_at"`
	DurationMinutes int       `json:"duration_minutes"`
	MeetingURL      string    `json:"meeting_url"`
	Status          string    `json:"status"` // scheduled, completed, cancelled, rescheduled
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// MentorshipFeedback represents review/rating feedback left for a mentorship session or relationship.
type MentorshipFeedback struct {
	ID           string    `json:"id"`
	MentorshipID string    `json:"mentorship_id"`
	SessionID    string    `json:"session_id,omitempty"`
	FromUserID   string    `json:"from_user_id"`
	ToUserID     string    `json:"to_user_id"`
	Rating       int       `json:"rating"` // 1 - 5
	Comment      string    `json:"comment"`
	CreatedAt    time.Time `json:"created_at"`
}

// MentorFilterParams parameters for searching and filtering mentors.
type MentorFilterParams struct {
	Search             string   `form:"search"`
	Expertise          []string `form:"expertise"`
	Industry           string   `form:"industry"`
	MinYearsExperience int      `form:"min_years_experience"`
	MaxHourlyRate      float64  `form:"max_hourly_rate"`
	Language           string   `form:"language"`
	IsAvailable        *bool    `form:"is_available"`
	Page               int      `form:"page"`
	Limit              int      `form:"limit"`
}

// DTOs

// UpdateMentorProfileDTO request body for creating/updating a mentor profile.
type UpdateMentorProfileDTO struct {
	Bio             string   `json:"bio"`
	JobTitle        string   `json:"job_title"`
	Company         string   `json:"company"`
	YearsExperience int      `json:"years_experience"`
	Expertise       []string `json:"expertise"`
	Industries      []string `json:"industries"`
	Languages       []string `json:"languages"`
	HourlyRate      float64  `json:"hourly_rate"`
	MaxMentees      int      `json:"max_mentees"`
	IsAvailable     *bool    `json:"is_available"`
	SessionTypes    []string `json:"session_types"`
}

// CreateMentorshipRequestDTO payload to send a mentorship request.
type CreateMentorshipRequestDTO struct {
	MentorID          string   `json:"mentor_id" binding:"required"`
	Message           string   `json:"message" binding:"required"`
	Goals             []string `json:"goals"`
	PreferredSchedule string   `json:"preferred_schedule"`
}

// UpdateMentorshipRequestDTO payload to accept/reject/cancel a request.
type UpdateMentorshipRequestDTO struct {
	Status          string `json:"status" binding:"required"` // accepted, rejected, cancelled
	ResponseMessage string `json:"response_message"`
}

// CreateMentorshipGoalDTO payload to create a new goal.
type CreateMentorshipGoalDTO struct {
	MentorshipID string     `json:"mentorship_id" binding:"required"`
	Title        string     `json:"title" binding:"required"`
	Description  string     `json:"description"`
	TargetDate   *time.Time `json:"target_date"`
}

// UpdateMentorshipGoalDTO payload to update a goal.
type UpdateMentorshipGoalDTO struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	TargetDate  *time.Time `json:"target_date"`
	Status      string     `json:"status"`
	Progress    int        `json:"progress"`
}

// CreateMentorshipSessionDTO payload to schedule a session.
type CreateMentorshipSessionDTO struct {
	MentorshipID    string    `json:"mentorship_id" binding:"required"`
	Title           string    `json:"title" binding:"required"`
	Description     string    `json:"description"`
	ScheduledAt     time.Time `json:"scheduled_at" binding:"required"`
	DurationMinutes int       `json:"duration_minutes" binding:"required"`
	MeetingURL      string    `json:"meeting_url"`
}

// UpdateMentorshipSessionDTO payload to update a session.
type UpdateMentorshipSessionDTO struct {
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	ScheduledAt     *time.Time `json:"scheduled_at"`
	DurationMinutes int        `json:"duration_minutes"`
	MeetingURL      string     `json:"meeting_url"`
	Status          string     `json:"status"`
	Notes           string     `json:"notes"`
}

// CreateMentorshipFeedbackDTO payload to submit feedback.
type CreateMentorshipFeedbackDTO struct {
	MentorshipID string `json:"mentorship_id" binding:"required"`
	SessionID    string `json:"session_id"`
	Rating       int    `json:"rating" binding:"required"`
	Comment      string `json:"comment"`
}
