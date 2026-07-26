package domain

import (
	"time"

	"github.com/google/uuid"
)

// Interview Statuses
const (
	StatusScheduled       = "scheduled"
	StatusInProgress      = "in_progress"
	StatusCompleted       = "completed"
	StatusCancelled       = "cancelled"
	StatusRescheduled     = "rescheduled"
	StatusFeedbackPending = "feedback_pending"
)

// Participant Roles
const (
	RoleInterviewer     = "interviewer"
	RoleLeadInterviewer = "lead_interviewer"
	RoleCandidate       = "candidate"
	RoleObserver        = "observer"
)

// RSVP Statuses
const (
	RSVPPending   = "pending"
	RSVPAccepted  = "accepted"
	RSVPDeclined  = "declined"
	RSVPTentative = "tentative"
)

// Recommendations
const (
	RecStrongHire   = "strong_hire"
	RecHire         = "hire"
	RecNeutral      = "neutral"
	RecNoHire       = "no_hire"
	RecStrongNoHire = "strong_no_hire"
)

type Interview struct {
	ID             uuid.UUID              `json:"id"`
	CandidateID    uuid.UUID              `json:"candidate_id"`
	CandidateName  string                 `json:"candidate_name,omitempty"`
	CandidateEmail string                 `json:"candidate_email,omitempty"`
	JobID          *uuid.UUID             `json:"job_id,omitempty"`
	JobTitle       string                 `json:"job_title,omitempty"`
	OrganizerID    uuid.UUID              `json:"organizer_id"`
	Title          string                 `json:"title"`
	Status         string                 `json:"status"`
	ScheduledStart time.Time              `json:"scheduled_start"`
	ScheduledEnd   time.Time              `json:"scheduled_end"`
	LocationType   string                 `json:"location_type"`
	MeetingLink    string                 `json:"meeting_link"`
	Notes          string                 `json:"notes"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
	Rounds         []InterviewRound       `json:"rounds,omitempty"`
	Participants   []InterviewParticipant `json:"participants,omitempty"`
}

type InterviewRound struct {
	ID             uuid.UUID              `json:"id"`
	InterviewID    uuid.UUID              `json:"interview_id"`
	RoundNumber    int                    `json:"round_number"`
	RoundName      string                 `json:"round_name"`
	RoundType      string                 `json:"round_type"`
	Status         string                 `json:"status"`
	ScheduledStart time.Time              `json:"scheduled_start"`
	ScheduledEnd   time.Time              `json:"scheduled_end"`
	MeetingLink    string                 `json:"meeting_link"`
	Instructions   string                 `json:"instructions"`
	CreatedAt      time.Time              `json:"created_at"`
	Participants   []InterviewParticipant `json:"participants,omitempty"`
	Feedback       []InterviewFeedback    `json:"feedback,omitempty"`
}

type InterviewParticipant struct {
	ID          uuid.UUID  `json:"id"`
	InterviewID uuid.UUID  `json:"interview_id"`
	RoundID     *uuid.UUID `json:"round_id,omitempty"`
	UserID      uuid.UUID  `json:"user_id"`
	UserName    string     `json:"user_name"`
	UserEmail   string     `json:"user_email"`
	Role        string     `json:"role"`
	RSVPStatus  string     `json:"rsvp_status"`
	CreatedAt   time.Time  `json:"created_at"`
}

type InterviewFeedback struct {
	ID                   uuid.UUID `json:"id"`
	InterviewID          uuid.UUID `json:"interview_id"`
	RoundID              uuid.UUID `json:"round_id"`
	InterviewerID        uuid.UUID `json:"interviewer_id"`
	InterviewerName      string    `json:"interviewer_name"`
	Rating               int       `json:"rating"`
	TechnicalScore       int       `json:"technical_score"`
	CommunicationScore   int       `json:"communication_score"`
	ProblemSolvingScore  int       `json:"problem_solving_score"`
	Recommendation       string    `json:"recommendation"`
	FeedbackText         string    `json:"feedback_text"`
	Strengths            string    `json:"strengths"`
	AreasForImprovement string    `json:"areas_for_improvement"`
	CreatedAt            time.Time `json:"created_at"`
}

type CandidateAvailability struct {
	ID          uuid.UUID `json:"id"`
	CandidateID uuid.UUID `json:"candidate_id"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Status      string    `json:"status"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateInterviewRequest struct {
	CandidateID    uuid.UUID                 `json:"candidate_id" binding:"required"`
	JobID          *uuid.UUID                `json:"job_id"`
	Title          string                    `json:"title" binding:"required"`
	ScheduledStart time.Time                 `json:"scheduled_start" binding:"required"`
	ScheduledEnd   time.Time                 `json:"scheduled_end" binding:"required"`
	LocationType   string                    `json:"location_type"`
	MeetingLink    string                    `json:"meeting_link"`
	Notes          string                    `json:"notes"`
	Rounds         []CreateRoundRequest      `json:"rounds"`
	Participants   []CreateParticipantRequest `json:"participants"`
}

type CreateRoundRequest struct {
	RoundNumber    int                       `json:"round_number"`
	RoundName      string                    `json:"round_name" binding:"required"`
	RoundType      string                    `json:"round_type"`
	ScheduledStart time.Time                 `json:"scheduled_start" binding:"required"`
	ScheduledEnd   time.Time                 `json:"scheduled_end" binding:"required"`
	MeetingLink    string                    `json:"meeting_link"`
	Instructions   string                    `json:"instructions"`
	Participants   []CreateParticipantRequest `json:"participants"`
}

type CreateParticipantRequest struct {
	UserID    uuid.UUID `json:"user_id" binding:"required"`
	UserName  string    `json:"user_name"`
	UserEmail string    `json:"user_email"`
	Role      string    `json:"role"`
}

type SubmitFeedbackRequest struct {
	Rating               int    `json:"rating" binding:"required,min=1,max=5"`
	TechnicalScore       int    `json:"technical_score" binding:"required,min=1,max=5"`
	CommunicationScore   int    `json:"communication_score" binding:"required,min=1,max=5"`
	ProblemSolvingScore  int    `json:"problem_solving_score" binding:"required,min=1,max=5"`
	Recommendation       string `json:"recommendation" binding:"required"`
	FeedbackText         string `json:"feedback_text" binding:"required"`
	Strengths            string `json:"strengths"`
	AreasForImprovement string `json:"areas_for_improvement"`
}

type SetAvailabilityRequest struct {
	StartTime time.Time `json:"start_time" binding:"required"`
	EndTime   time.Time `json:"end_time" binding:"required"`
	Status    string    `json:"status"`
	Notes     string    `json:"notes"`
}
