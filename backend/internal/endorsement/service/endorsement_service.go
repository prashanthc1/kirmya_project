package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"kirmya/internal/endorsement/domain"
	"kirmya/internal/endorsement/repository"

	"github.com/google/uuid"
)

type EndorsementService interface {
	EndorseSkill(ctx context.Context, endorserID uuid.UUID, payload domain.EndorseSkillPayload) (*domain.SkillEndorsement, error)
	GetUserEndorsements(ctx context.Context, userID uuid.UUID) ([]domain.SkillEndorsementGroup, error)

	SubmitRecommendation(ctx context.Context, authorID uuid.UUID, payload domain.SubmitRecommendationPayload) (*domain.ProfessionalRecommendation, error)
	GetRecommendationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.ProfessionalRecommendation, error)
	UpdateRecommendationStatus(ctx context.Context, userID uuid.UUID, recID uuid.UUID, status string, isFlagged bool) error

	CreateReference(ctx context.Context, candidateID uuid.UUID, payload domain.CreateReferencePayload) (*domain.ProfessionalReference, error)
	GetUserReferences(ctx context.Context, candidateID uuid.UUID) ([]domain.ProfessionalReference, error)
}

type endorsementService struct {
	repo repository.EndorsementRepository
}

func NewEndorsementService(repo repository.EndorsementRepository) EndorsementService {
	return &endorsementService{repo: repo}
}

func (s *endorsementService) EndorseSkill(ctx context.Context, endorserID uuid.UUID, payload domain.EndorseSkillPayload) (*domain.SkillEndorsement, error) {
	targetUserID, err := uuid.Parse(payload.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid target user ID: %w", err)
	}

	// Abuse Prevention Rule 1: Self-Endorsement Block
	if endorserID == targetUserID {
		return nil, errors.New("abuse prevention violation: you cannot endorse your own skills")
	}

	// Abuse Prevention Rule 2: Duplicate Endorsement Prevention
	alreadyEndorsed, err := s.repo.HasEndorsed(ctx, targetUserID, endorserID, payload.SkillName)
	if err != nil {
		return nil, err
	}
	if alreadyEndorsed {
		return nil, errors.New("abuse prevention violation: you have already endorsed this skill for this user")
	}

	endorserName := payload.EndorserName
	if endorserName == "" {
		endorserName = "Verified Professional Peer"
	}

	end := &domain.SkillEndorsement{
		ID:                uuid.New(),
		UserID:            targetUserID,
		EndorserID:        endorserID,
		SkillName:         strings.TrimSpace(payload.SkillName),
		EndorserName:      endorserName,
		EndorserTitle:     payload.EndorserTitle,
		EndorserAvatarURL: payload.EndorserAvatarURL,
		CreatedAt:         time.Now(),
	}

	if err := s.repo.CreateEndorsement(ctx, end); err != nil {
		return nil, err
	}
	return end, nil
}

func (s *endorsementService) GetUserEndorsements(ctx context.Context, userID uuid.UUID) ([]domain.SkillEndorsementGroup, error) {
	return s.repo.GetUserEndorsements(ctx, userID)
}

func (s *endorsementService) SubmitRecommendation(ctx context.Context, authorID uuid.UUID, payload domain.SubmitRecommendationPayload) (*domain.ProfessionalRecommendation, error) {
	recipientID, err := uuid.Parse(payload.RecipientID)
	if err != nil {
		return nil, fmt.Errorf("invalid recipient user ID: %w", err)
	}

	// Abuse Prevention Rule 3: Self-Recommendation Block
	if authorID == recipientID {
		return nil, errors.New("abuse prevention violation: you cannot write a recommendation for yourself")
	}

	authorName := payload.AuthorName
	if authorName == "" {
		authorName = "Senior Engineering Manager"
	}

	// Default status is 'pending_approval' requiring recipient consent before public display
	rec := &domain.ProfessionalRecommendation{
		ID:              uuid.New(),
		RecipientID:     recipientID,
		AuthorID:        authorID,
		AuthorName:      authorName,
		AuthorTitle:     payload.AuthorTitle,
		AuthorAvatarURL: payload.AuthorAvatarURL,
		Relationship:    payload.Relationship,
		ContentText:     payload.ContentText,
		Status:          domain.RecStatusPending,
		IsFlagged:       false,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.repo.CreateRecommendation(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *endorsementService) GetRecommendationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.ProfessionalRecommendation, error) {
	return s.repo.GetRecommendationsForUser(ctx, userID)
}

func (s *endorsementService) UpdateRecommendationStatus(ctx context.Context, userID uuid.UUID, recID uuid.UUID, status string, isFlagged bool) error {
	return s.repo.UpdateRecommendationStatus(ctx, recID, status, isFlagged)
}

func (s *endorsementService) CreateReference(ctx context.Context, candidateID uuid.UUID, payload domain.CreateReferencePayload) (*domain.ProfessionalReference, error) {
	ref := &domain.ProfessionalReference{
		ID:           uuid.New(),
		CandidateID:  candidateID,
		RefereeName:  payload.RefereeName,
		RefereeTitle: payload.RefereeTitle,
		CompanyName:  payload.CompanyName,
		RefereeEmail: payload.RefereeEmail,
		RefereePhone: payload.RefereePhone,
		Relationship: payload.Relationship,
		Status:       "confirmed",
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateReference(ctx, ref); err != nil {
		return nil, err
	}
	return ref, nil
}

func (s *endorsementService) GetUserReferences(ctx context.Context, candidateID uuid.UUID) ([]domain.ProfessionalReference, error) {
	return s.repo.GetUserReferences(ctx, candidateID)
}
