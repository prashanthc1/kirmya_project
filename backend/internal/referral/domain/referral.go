package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	ReqStatusOpen    = "open"
	ReqStatusMatched = "matched"
	ReqStatusClosed  = "closed"

	RefStatusPendingAccept = "pending_accept"
	RefStatusAccepted      = "accepted"
	RefStatusSubmittedATS  = "submitted_to_ats"
	RefStatusInterviewing  = "interviewing"
	RefStatusHired        = "hired"
	RefStatusRejected     = "rejected"
)

type ReferralRequest struct {
	ID                uuid.UUID `json:"id"`
	CandidateID       uuid.UUID `json:"candidate_id"`
	CandidateName     string    `json:"candidate_name"`
	CompanyName       string    `json:"company_name"`
	JobTitle          string    `json:"job_title"`
	TargetJobURL      string    `json:"target_job_url"`
	ResumeLink        string    `json:"resume_link"`
	MessageToReferrer string    `json:"message_to_referrer"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type ReferralHistory struct {
	ID             uuid.UUID `json:"id"`
	ReferralID     uuid.UUID `json:"referral_id"`
	ActorID        uuid.UUID `json:"actor_id"`
	PreviousStatus string    `json:"previous_status"`
	NewStatus      string    `json:"new_status"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
}

type Referral struct {
	ID               uuid.UUID         `json:"id"`
	RequestID        uuid.UUID         `json:"request_id"`
	CandidateID      uuid.UUID         `json:"candidate_id"`
	CandidateName    string            `json:"candidate_name"`
	ReferrerID       uuid.UUID         `json:"referrer_id"`
	ReferrerName     string            `json:"referrer_name"`
	ReferrerCompany  string            `json:"referrer_company"`
	ReferrerJobTitle string            `json:"referrer_job_title"`
	ReferrerEmail    string            `json:"referrer_email"`
	Status           string            `json:"status"`
	PrivacyMasked    bool              `json:"privacy_masked"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`
	History          []ReferralHistory `json:"history,omitempty"`
}

type CreateReferralRequestPayload struct {
	CompanyName       string `json:"company_name" binding:"required"`
	JobTitle          string `json:"job_title" binding:"required"`
	TargetJobURL      string `json:"target_job_url"`
	ResumeLink        string `json:"resume_link"`
	MessageToReferrer string `json:"message_to_referrer" binding:"required"`
}

type OfferReferralPayload struct {
	RequestID        string `json:"request_id" binding:"required"`
	ReferrerName     string `json:"referrer_name"`
	ReferrerCompany  string `json:"referrer_company" binding:"required"`
	ReferrerJobTitle string `json:"referrer_job_title" binding:"required"`
	ReferrerEmail    string `json:"referrer_email" binding:"required"`
}

type UpdateReferralStatusPayload struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}
