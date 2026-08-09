package models

import (
	"time"

	"github.com/google/uuid"
)

// InterviewPreparation represents an interview prep workspace for a target job/company
type InterviewPreparation struct {
	ID                  uuid.UUID `json:"id"`
	UserID              uuid.UUID `json:"user_id"`
	JobID               *uuid.UUID `json:"job_id,omitempty"`
	ApplicationID       *uuid.UUID `json:"application_id,omitempty"`
	CompanyName         string    `json:"company_name"`
	JobTitle            string    `json:"job_title"`
	JobDescription      string    `json:"job_description"`
	InterviewDate       *time.Time `json:"interview_date,omitempty"`
	InterviewType       string    `json:"interview_type"` // Behavioral, Technical, System Design, Situational, Case Study
	InterviewRound      string    `json:"interview_round"` // Recruiter Round, Hiring Manager, Technical, Onsite
	ExperienceLevel     string    `json:"experience_level"` // Entry-Level, Mid-Level, Senior, Lead/Executive
	PreparationDuration string    `json:"preparation_duration"` // 3 Days, 7 Days, 14 Days, 30 Days
	Status              string    `json:"status"` // In Progress, Ready, Completed, Archived
	ReadinessScore      int       `json:"readiness_score"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// InterviewQuestion represents a question in the preparation library
type InterviewQuestion struct {
	ID            uuid.UUID `json:"id"`
	PreparationID *uuid.UUID `json:"preparation_id,omitempty"`
	UserID        uuid.UUID `json:"user_id"`
	Question      string    `json:"question"`
	Category      string    `json:"category"` // Behavioral, Technical, Situational, Leadership, Culture Fit
	Difficulty    string    `json:"difficulty"` // Beginner, Intermediate, Advanced, Expert
	SampleAnswer  string    `json:"sample_answer"`
	UserAnswer    string    `json:"user_answer"`
	Notes         string    `json:"notes"`
	IsPracticed   bool      `json:"is_practiced"`
	IsSaved       bool      `json:"is_saved"`
	STARSituation string    `json:"star_situation"`
	STARTask      string    `json:"star_task"`
	STARAction    string    `json:"star_action"`
	STARResult    string    `json:"star_result"`
	CreatedAt     time.Time `json:"created_at"`
}

// MockInterviewSession represents an AI mock interview practice session
type MockInterviewSession struct {
	ID                 uuid.UUID           `json:"id"`
	UserID             uuid.UUID           `json:"user_id"`
	PreparationID      *uuid.UUID          `json:"preparation_id,omitempty"`
	Title              string              `json:"title"`
	InterviewType      string              `json:"interview_type"`
	Difficulty         string              `json:"difficulty"`
	TotalQuestions     int                 `json:"total_questions"`
	CompletedQuestions int                 `json:"completed_questions"`
	OverallScore       int                 `json:"overall_score"`
	RelevanceScore     int                 `json:"relevance_score"`
	ClarityScore       int                 `json:"clarity_score"`
	ConfidenceScore    int                 `json:"confidence_score"`
	TechnicalScore     int                 `json:"technical_score"`
	CommunicationScore int                 `json:"communication_score"`
	StructureScore     int                 `json:"structure_score"`
	Status             string              `json:"status"` // Active, Completed, Abandoned
	StartedAt          time.Time           `json:"started_at"`
	CompletedAt        *time.Time          `json:"completed_at,omitempty"`
	Answers            []MockInterviewAnswer `json:"answers,omitempty"`
}

// MockInterviewAnswer represents an evaluated answer within a mock interview session
type MockInterviewAnswer struct {
	ID                 uuid.UUID `json:"id"`
	SessionID          uuid.UUID `json:"session_id"`
	QuestionText       string    `json:"question_text"`
	CandidateAnswer    string    `json:"candidate_answer"`
	AudioTranscript    string    `json:"audio_transcript"`
	OverallScore       int       `json:"overall_score"`
	RelevanceScore     int       `json:"relevance_score"`
	ClarityScore       int       `json:"clarity_score"`
	ConfidenceScore    int       `json:"confidence_score"`
	TechnicalScore     int       `json:"technical_score"`
	CommunicationScore int       `json:"communication_score"`
	StructureScore     int       `json:"structure_score"`
	WhatWentWell       string    `json:"what_went_well"`
	WhatCouldImprove   string    `json:"what_could_improve"`
	SuggestedAnswer    string    `json:"suggested_answer"`
	HasSTARSituation   bool      `json:"has_star_situation"`
	HasSTARTask        bool      `json:"has_star_task"`
	HasSTARAction      bool      `json:"has_star_action"`
	HasSTARResult      bool      `json:"has_star_result"`
	CreatedAt          time.Time `json:"created_at"`
}

// PreparationTask represents a checklist task for interview readiness
type PreparationTask struct {
	ID            uuid.UUID  `json:"id"`
	PreparationID uuid.UUID  `json:"preparation_id"`
	Title         string     `json:"title"`
	Category      string     `json:"category"`
	DueDate       *time.Time `json:"due_date,omitempty"`
	IsCompleted   bool       `json:"is_completed"`
	CreatedAt     time.Time  `json:"created_at"`
}

// InterviewNote represents post-interview debrief notes and follow-up email draft
type InterviewNote struct {
	ID                   uuid.UUID `json:"id"`
	PreparationID        uuid.UUID `json:"preparation_id"`
	UserID               uuid.UUID `json:"user_id"`
	Interviewers         string    `json:"interviewers"`
	TopicsDiscussed      string    `json:"topics_discussed"`
	QuestionsAsked       string    `json:"questions_asked"`
	CandidatePerformance string    `json:"candidate_performance"`
	PersonalNotes        string    `json:"personal_notes"`
	OverallFeeling       string    `json:"overall_feeling"` // Excellent, Good, Average, Challenging
	PotentialStrengths   string    `json:"potential_strengths"`
	PotentialWeaknesses  string    `json:"potential_weaknesses"`
	FollowUpSuggestions  string    `json:"follow_up_suggestions"`
	ThankYouDraft        string    `json:"thank_you_draft"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// InterviewReadinessScore represents user's overall interview readiness metrics
type InterviewReadinessScore struct {
	UserID                   uuid.UUID `json:"user_id"`
	OverallReadiness         int       `json:"overall_readiness"`
	TechnicalReadiness       int       `json:"technical_readiness"`
	BehavioralReadiness      int       `json:"behavioral_readiness"`
	CommunicationReadiness   int       `json:"communication_readiness"`
	RoleFitReadiness         int       `json:"role_fit_readiness"`
	CompanyKnowledgeReadiness int       `json:"company_knowledge_readiness"`
	TotalMockSessions        int       `json:"total_mock_sessions"`
	TotalQuestionsPracticed  int       `json:"total_questions_practiced"`
	UpdatedAt                time.Time `json:"updated_at"`
}

// AICoachMessage represents a single message in an AI coach session
type AICoachMessage struct {
	Sender    string    `json:"sender"` // "user" or "ai"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// AICoachSession represents an interactive AI coaching conversation
type AICoachSession struct {
	ID        uuid.UUID        `json:"id"`
	UserID    uuid.UUID        `json:"user_id"`
	Topic     string           `json:"topic"`
	Messages  []AICoachMessage `json:"messages"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}

// DTO Requests & Responses

type CreatePreparationRequest struct {
	JobID               *uuid.UUID `json:"job_id,omitempty"`
	ApplicationID       *uuid.UUID `json:"application_id,omitempty"`
	CompanyName         string    `json:"company_name" binding:"required"`
	JobTitle            string    `json:"job_title" binding:"required"`
	JobDescription      string    `json:"job_description"`
	InterviewDate       *time.Time `json:"interview_date,omitempty"`
	InterviewType       string    `json:"interview_type"`
	InterviewRound      string    `json:"interview_round"`
	ExperienceLevel     string    `json:"experience_level"`
	PreparationDuration string    `json:"preparation_duration"`
}

type UpdatePreparationRequest struct {
	CompanyName         string     `json:"company_name"`
	JobTitle            string     `json:"job_title"`
	JobDescription      string     `json:"job_description"`
	InterviewDate       *time.Time `json:"interview_date,omitempty"`
	InterviewType       string     `json:"interview_type"`
	InterviewRound      string     `json:"interview_round"`
	ExperienceLevel     string     `json:"experience_level"`
	PreparationDuration string     `json:"preparation_duration"`
	Status              string     `json:"status"`
}

type GenerateQuestionsRequest struct {
	PreparationID *uuid.UUID `json:"preparation_id,omitempty"`
	JobTitle      string     `json:"job_title"`
	CompanyName   string     `json:"company_name"`
	Category      string     `json:"category"`
	Difficulty    string     `json:"difficulty"`
	Count         int        `json:"count"`
}

type SaveQuestionRequest struct {
	PreparationID *uuid.UUID `json:"preparation_id,omitempty"`
	Question      string     `json:"question" binding:"required"`
	Category      string     `json:"category"`
	Difficulty    string     `json:"difficulty"`
	SampleAnswer  string     `json:"sample_answer"`
	UserAnswer    string     `json:"user_answer"`
	Notes         string     `json:"notes"`
	STARSituation string     `json:"star_situation"`
	STARTask      string     `json:"star_task"`
	STARAction    string     `json:"star_action"`
	STARResult    string     `json:"star_result"`
}

type UpdateQuestionPracticeRequest struct {
	UserAnswer    string `json:"user_answer"`
	Notes         string `json:"notes"`
	STARSituation string `json:"star_situation"`
	STARTask      string `json:"star_task"`
	STARAction    string `json:"star_action"`
	STARResult    string `json:"star_result"`
	IsPracticed   bool   `json:"is_practiced"`
}

type StartMockSessionRequest struct {
	PreparationID *uuid.UUID `json:"preparation_id,omitempty"`
	Title         string     `json:"title"`
	InterviewType string     `json:"interview_type"`
	Difficulty    string     `json:"difficulty"`
	TotalQuestions int       `json:"total_questions"`
}

type SubmitMockAnswerRequest struct {
	QuestionText    string `json:"question_text" binding:"required"`
	CandidateAnswer string `json:"candidate_answer"`
	AudioTranscript string `json:"audio_transcript"`
}

type CreateTaskRequest struct {
	PreparationID uuid.UUID  `json:"preparation_id" binding:"required"`
	Title         string     `json:"title" binding:"required"`
	Category      string     `json:"category"`
	DueDate       *time.Time `json:"due_date,omitempty"`
}

type SaveInterviewNoteRequest struct {
	PreparationID        uuid.UUID `json:"preparation_id" binding:"required"`
	Interviewers         string    `json:"interviewers"`
	TopicsDiscussed      string    `json:"topics_discussed"`
	QuestionsAsked       string    `json:"questions_asked"`
	CandidatePerformance string    `json:"candidate_performance"`
	PersonalNotes        string    `json:"personal_notes"`
	OverallFeeling       string    `json:"overall_feeling"`
	PotentialStrengths   string    `json:"potential_strengths"`
	PotentialWeaknesses  string    `json:"potential_weaknesses"`
	FollowUpSuggestions  string    `json:"follow_up_suggestions"`
	GenerateThankYou     bool      `json:"generate_thank_you"`
}

type AICoachChatRequest struct {
	SessionID *uuid.UUID `json:"session_id,omitempty"`
	Topic     string     `json:"topic"`
	Message   string     `json:"message" binding:"required"`
}
