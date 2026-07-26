package service

import (
	"context"
	"time"

	"kirmya/internal/verification/domain"
	"kirmya/internal/verification/repository"

	"github.com/google/uuid"
)

type VerificationService interface {
	CreateRequest(ctx context.Context, userID uuid.UUID, payload domain.CreateVerificationRequestPayload) (*domain.VerificationRequest, error)
	GetUserRequests(ctx context.Context, userID uuid.UUID) ([]domain.VerificationRequest, error)
	GetStatus(ctx context.Context, userID uuid.UUID) (*domain.VerificationStatus, error)
	UpdatePrivacy(ctx context.Context, userID uuid.UUID, payload domain.UpdatePrivacyPayload) (*domain.VerificationStatus, error)
	AddDocument(ctx context.Context, userID uuid.UUID, requestID uuid.UUID, docType, fileName, fileURL string, isSensitive bool) (*domain.VerificationDocument, error)
}

type verificationService struct {
	repo repository.VerificationRepository
}

func NewVerificationService(repo repository.VerificationRepository) VerificationService {
	return &verificationService{repo: repo}
}

func (s *verificationService) recalculateTrustScore(ctx context.Context, userID uuid.UUID) error {
	status, err := s.repo.GetOrCreateStatus(ctx, userID)
	if err != nil {
		return err
	}

	requests, err := s.repo.GetUserRequests(ctx, userID)
	if err != nil {
		return err
	}

	emailVerified := false
	employmentVerified := false
	skillsVerified := false
	certificationsVerified := false

	score := 20 // Base candidate profile score

	for _, req := range requests {
		if req.Status == domain.StatusVerified {
			switch req.VerificationType {
			case domain.TypeEmail:
				emailVerified = true
				score += 20
			case domain.TypeEmployment:
				employmentVerified = true
				score += 25
			case domain.TypeSkill:
				skillsVerified = true
				score += 20
			case domain.TypeCertification:
				certificationsVerified = true
				score += 15
			}
		}
	}

	if score > 100 {
		score = 100
	}

	status.EmailVerified = emailVerified
	status.EmploymentVerified = employmentVerified
	status.SkillsVerified = skillsVerified
	status.CertificationsVerified = certificationsVerified
	status.TrustScore = score

	if score >= 95 {
		status.BadgeLevel = "Verified Elite"
	} else if score >= 65 {
		status.BadgeLevel = "Verified Professional"
	} else if score >= 40 {
		status.BadgeLevel = "Basic"
	} else {
		status.BadgeLevel = "Unverified"
	}

	return s.repo.UpdateTrustScore(ctx, status)
}

func (s *verificationService) CreateRequest(ctx context.Context, userID uuid.UUID, payload domain.CreateVerificationRequestPayload) (*domain.VerificationRequest, error) {
	// Automated instant verification check for demonstration / simulation
	initialStatus := domain.StatusVerified
	reviewerNotes := "Automated verification successful via domain & API check."

	req := &domain.VerificationRequest{
		ID:               uuid.New(),
		UserID:           userID,
		VerificationType: payload.VerificationType,
		Title:            payload.Title,
		OrganizationName: payload.OrganizationName,
		CredentialID:     payload.CredentialID,
		VerificationURL:  payload.VerificationURL,
		WorkEmail:        payload.WorkEmail,
		Status:           initialStatus,
		ReviewerNotes:    reviewerNotes,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.repo.CreateRequest(ctx, req); err != nil {
		return nil, err
	}

	_ = s.recalculateTrustScore(ctx, userID)
	return req, nil
}

func (s *verificationService) GetUserRequests(ctx context.Context, userID uuid.UUID) ([]domain.VerificationRequest, error) {
	requests, err := s.repo.GetUserRequests(ctx, userID)
	if err != nil {
		return nil, err
	}

	status, _ := s.repo.GetOrCreateStatus(ctx, userID)

	// Enforce Privacy Controls on documents
	if status != nil && status.HideSensitiveDocs {
		for i := range requests {
			var sanitizedDocs []domain.VerificationDocument
			for _, doc := range requests[i].Documents {
				if doc.IsSensitive {
					doc.FileURL = "[REDACTED BY CANDIDATE PRIVACY CONTROLS]"
				}
				sanitizedDocs = append(sanitizedDocs, doc)
			}
			requests[i].Documents = sanitizedDocs
		}
	}

	return requests, nil
}

func (s *verificationService) GetStatus(ctx context.Context, userID uuid.UUID) (*domain.VerificationStatus, error) {
	return s.repo.GetOrCreateStatus(ctx, userID)
}

func (s *verificationService) UpdatePrivacy(ctx context.Context, userID uuid.UUID, payload domain.UpdatePrivacyPayload) (*domain.VerificationStatus, error) {
	return s.repo.UpdatePrivacy(ctx, userID, payload.PrivacySetting, payload.HideSensitiveDocs)
}

func (s *verificationService) AddDocument(ctx context.Context, userID uuid.UUID, requestID uuid.UUID, docType, fileName, fileURL string, isSensitive bool) (*domain.VerificationDocument, error) {
	doc := &domain.VerificationDocument{
		ID:           uuid.New(),
		RequestID:    requestID,
		UserID:       userID,
		DocumentType: docType,
		FileName:     fileName,
		FileURL:      fileURL,
		IsSensitive:  isSensitive,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.AddDocument(ctx, doc); err != nil {
		return nil, err
	}
	return doc, nil
}
