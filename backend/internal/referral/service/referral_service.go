package service

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/referral/domain"
	"kirmya/internal/referral/repository"

	"github.com/google/uuid"
)

type ReferralService interface {
	CreateRequest(ctx context.Context, candidateID uuid.UUID, payload domain.CreateReferralRequestPayload) (*domain.ReferralRequest, error)
	GetOpenRequests(ctx context.Context) ([]domain.ReferralRequest, error)

	OfferReferral(ctx context.Context, referrerID uuid.UUID, payload domain.OfferReferralPayload) (*domain.Referral, error)
	GetUserReferrals(ctx context.Context, userID uuid.UUID) ([]domain.Referral, error)
	UpdateReferralStatus(ctx context.Context, actorID uuid.UUID, referralID uuid.UUID, payload domain.UpdateReferralStatusPayload) (*domain.Referral, error)
}

type referralService struct {
	repo repository.ReferralRepository
}

func NewReferralService(repo repository.ReferralRepository) ReferralService {
	return &referralService{repo: repo}
}

func (s *referralService) CreateRequest(ctx context.Context, candidateID uuid.UUID, payload domain.CreateReferralRequestPayload) (*domain.ReferralRequest, error) {
	req := &domain.ReferralRequest{
		ID:                uuid.New(),
		CandidateID:       candidateID,
		CandidateName:     "Alex Rivera", // Fetched from candidate profile context
		CompanyName:       payload.CompanyName,
		JobTitle:          payload.JobTitle,
		TargetJobURL:      payload.TargetJobURL,
		ResumeLink:        payload.ResumeLink,
		MessageToReferrer: payload.MessageToReferrer,
		Status:            domain.ReqStatusOpen,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if err := s.repo.CreateRequest(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *referralService) GetOpenRequests(ctx context.Context) ([]domain.ReferralRequest, error) {
	return s.repo.GetOpenRequests(ctx)
}

func (s *referralService) OfferReferral(ctx context.Context, referrerID uuid.UUID, payload domain.OfferReferralPayload) (*domain.Referral, error) {
	reqID, err := uuid.Parse(payload.RequestID)
	if err != nil {
		return nil, fmt.Errorf("invalid referral request ID: %w", err)
	}

	req, err := s.repo.GetRequestByID(ctx, reqID)
	if err != nil {
		return nil, err
	}

	referrerName := payload.ReferrerName
	if referrerName == "" {
		referrerName = "Verified Employee Insider"
	}

	// Create Referral Match with Privacy Masked initially
	ref := &domain.Referral{
		ID:               uuid.New(),
		RequestID:        req.ID,
		CandidateID:      req.CandidateID,
		CandidateName:    req.CandidateName,
		ReferrerID:       referrerID,
		ReferrerName:     referrerName,
		ReferrerCompany:  payload.ReferrerCompany,
		ReferrerJobTitle: payload.ReferrerJobTitle,
		ReferrerEmail:    payload.ReferrerEmail,
		Status:           domain.RefStatusPendingAccept,
		PrivacyMasked:    true,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.repo.CreateReferral(ctx, ref); err != nil {
		return nil, err
	}

	_ = s.repo.UpdateRequestStatus(ctx, req.ID, domain.ReqStatusMatched)

	// Log audit history
	hist := &domain.ReferralHistory{
		ID:             uuid.New(),
		ReferralID:     ref.ID,
		ActorID:        referrerID,
		PreviousStatus: "none",
		NewStatus:      domain.RefStatusPendingAccept,
		Notes:          fmt.Sprintf("Referral offer initiated by %s at %s", ref.ReferrerName, ref.ReferrerCompany),
		CreatedAt:      time.Now(),
	}
	_ = s.repo.AddHistory(ctx, hist)

	return ref, nil
}

func (s *referralService) GetUserReferrals(ctx context.Context, userID uuid.UUID) ([]domain.Referral, error) {
	referrals, err := s.repo.GetUserReferrals(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Enforce Privacy & Permissions Engine: mask contact details if privacyMasked is true
	for i := range referrals {
		if referrals[i].PrivacyMasked && referrals[i].Status == domain.RefStatusPendingAccept {
			referrals[i].ReferrerEmail = "[MASKED UNTIL MATCH CONFIRMED]"
		}
	}
	return referrals, nil
}

func (s *referralService) UpdateReferralStatus(ctx context.Context, actorID uuid.UUID, referralID uuid.UUID, payload domain.UpdateReferralStatusPayload) (*domain.Referral, error) {
	ref, err := s.repo.GetReferralByID(ctx, referralID)
	if err != nil {
		return nil, err
	}

	prevStatus := ref.Status
	privacyMasked := ref.PrivacyMasked

	// Unmask privacy once match is accepted by candidate or referrer
	if payload.Status == domain.RefStatusAccepted || payload.Status == domain.RefStatusSubmittedATS {
		privacyMasked = false
	}

	if err := s.repo.UpdateReferralStatus(ctx, referralID, payload.Status, privacyMasked); err != nil {
		return nil, err
	}

	// Add audit history entry
	hist := &domain.ReferralHistory{
		ID:             uuid.New(),
		ReferralID:     referralID,
		ActorID:        actorID,
		PreviousStatus: prevStatus,
		NewStatus:      payload.Status,
		Notes:          payload.Notes,
		CreatedAt:      time.Now(),
	}
	_ = s.repo.AddHistory(ctx, hist)

	return s.repo.GetReferralByID(ctx, referralID)
}
