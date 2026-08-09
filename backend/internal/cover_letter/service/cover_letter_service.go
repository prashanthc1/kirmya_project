package service

import (
	"context"
	"encoding/json"
	"fmt"
	"kirmya/internal/cover_letter/models"
	"kirmya/internal/cover_letter/repository"
	"strings"
	"time"

	"github.com/google/uuid"
)

type CoverLetterService struct {
	repo *repository.CoverLetterRepository
}

func NewCoverLetterService(repo *repository.CoverLetterRepository) *CoverLetterService {
	return &CoverLetterService{repo: repo}
}

func (s *CoverLetterService) ListCoverLetters(ctx context.Context, userID uuid.UUID) ([]models.CoverLetter, error) {
	list, err := s.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []models.CoverLetter{}
	}
	return list, nil
}

func (s *CoverLetterService) GetCoverLetter(ctx context.Context, id uuid.UUID) (*models.CoverLetter, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *CoverLetterService) CreateCoverLetter(ctx context.Context, userID uuid.UUID, name, template string) (*models.CoverLetter, error) {
	cID := uuid.New()
	if name == "" {
		name = "Cover Letter"
	}
	if template == "" {
		template = "modern"
	}

	dateStr := time.Now().Format("January 2, 2006")
	intro := "I am writing to express my enthusiastic interest in the Senior Full-Stack Engineer position at your organization. With over 6 years of experience engineering high-throughput microservices in Golang and building responsive user interfaces in Next.js, I am confident in my ability to deliver immediate value to your engineering team."
	body := "Throughout my career, I have specialized in designing resilient, scalable software systems. In my recent role, I led the redesign of a core event-driven API gateway, which increased request processing capacity by 40% while reducing latency by 35%. Additionally, I have collaborated closely with product managers and UX designers to craft glassmorphism UI components adhering strictly to WCAG AA accessibility standards."
	closing := "Thank you for taking the time to review my application. I would welcome the opportunity to discuss how my technical background and passion for scalable system architecture align with your team's goals."

	fullContent := fmt.Sprintf("Dear Hiring Team,\n\n%s\n\n%s\n\n%s\n\nSincerely,\nAlex Morgan", intro, body, closing)
	words := len(strings.Fields(fullContent))
	chars := len(fullContent)

	cl := &models.CoverLetter{
		ID:                 cID,
		UserID:             userID,
		Name:               name,
		CompanyName:        "TechFlow Systems",
		JobTitle:           "Senior Full-Stack Engineer",
		RecipientName:      "Hiring Team",
		RecipientTitle:     "Head of Talent Acquisition",
		JobReferenceNumber: "REQ-2026-987",
		Location:           "San Francisco, CA",
		Date:               dateStr,
		OpeningGreeting:    "Dear Hiring Team,",
		Introduction:       intro,
		Body:               body,
		Closing:            closing,
		Signature:          "Alex Morgan",
		FullContent:        fullContent,
		TemplateName:       template,
		Tone:               "Professional",
		TargetLength:       "Standard",
		IsAiGenerated:      false,
		IsJobSpecific:      true,
		WordCount:          words,
		CharacterCount:     chars,
		JobMatchScore:      92,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.repo.Create(ctx, cl); err != nil {
		return nil, err
	}

	return s.repo.GetByID(ctx, cID)
}

func (s *CoverLetterService) UpdateCoverLetter(ctx context.Context, id uuid.UUID, updated *models.CoverLetter) (*models.CoverLetter, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil || existing == nil {
		return nil, fmt.Errorf("cover letter not found")
	}

	updated.ID = id
	updated.FullContent = fmt.Sprintf("%s\n\n%s\n\n%s\n\n%s\n\n%s", updated.OpeningGreeting, updated.Introduction, updated.Body, updated.Closing, updated.Signature)
	updated.WordCount = len(strings.Fields(updated.FullContent))
	updated.CharacterCount = len(updated.FullContent)

	if err := s.repo.Update(ctx, updated); err != nil {
		return nil, err
	}

	// Create historical version checkpoint
	full, err := s.repo.GetByID(ctx, id)
	if err == nil && full != nil {
		snapshotBytes, _ := json.Marshal(full)
		verTag := fmt.Sprintf("v%s", time.Now().Format("20060102-150405"))
		version := &models.CoverLetterVersion{
			ID:              uuid.New(),
			CoverLetterID:   id,
			VersionTag:      verTag,
			ContentSnapshot: string(snapshotBytes),
			WordCount:       full.WordCount,
			CreatedBy:       "User",
			CreatedAt:       time.Now(),
		}
		_ = s.repo.CreateVersion(ctx, version)
	}

	return s.repo.GetByID(ctx, id)
}

func (s *CoverLetterService) DeleteCoverLetter(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *CoverLetterService) DuplicateCoverLetter(ctx context.Context, id uuid.UUID) (*models.CoverLetter, error) {
	src, err := s.repo.GetByID(ctx, id)
	if err != nil || src == nil {
		return nil, fmt.Errorf("source cover letter not found")
	}

	destID := uuid.New()
	dest := &models.CoverLetter{
		ID:                 destID,
		UserID:             src.UserID,
		Name:               fmt.Sprintf("Copy of %s", src.Name),
		JobID:              src.JobID,
		CompanyName:        src.CompanyName,
		JobTitle:           src.JobTitle,
		RecipientName:      src.RecipientName,
		RecipientTitle:     src.RecipientTitle,
		JobReferenceNumber: src.JobReferenceNumber,
		Location:           src.Location,
		Date:               src.Date,
		OpeningGreeting:    src.OpeningGreeting,
		Introduction:       src.Introduction,
		Body:               src.Body,
		Closing:            src.Closing,
		Signature:          src.Signature,
		FullContent:        src.FullContent,
		TemplateName:       src.TemplateName,
		Tone:               src.Tone,
		TargetLength:       src.TargetLength,
		IsAiGenerated:      src.IsAiGenerated,
		IsJobSpecific:      src.IsJobSpecific,
		WordCount:          src.WordCount,
		CharacterCount:     src.CharacterCount,
		JobMatchScore:      src.JobMatchScore,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.repo.Create(ctx, dest); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, destID)
}

func (s *CoverLetterService) GenerateCoverLetter(ctx context.Context, userID uuid.UUID, req models.GenerateCoverLetterRequest) (*models.CoverLetter, error) {
	name := fmt.Sprintf("%s - %s", req.JobTitle, req.CompanyName)
	if req.JobTitle == "" {
		name = "AI Cover Letter"
	}
	cl, err := s.CreateCoverLetter(ctx, userID, name, "modern")
	if err != nil {
		return nil, err
	}

	cl.IsAiGenerated = true
	cl.IsJobSpecific = true
	if req.CompanyName != "" {
		cl.CompanyName = req.CompanyName
	}
	if req.JobTitle != "" {
		cl.JobTitle = req.JobTitle
	}
	if req.Tone != "" {
		cl.Tone = req.Tone
	}
	if req.Length != "" {
		cl.TargetLength = req.Length
	}

	_ = s.repo.Update(ctx, cl)
	return s.repo.GetByID(ctx, cl.ID)
}

func (s *CoverLetterService) RewriteContent(ctx context.Context, id uuid.UUID, req models.RewriteRequest) (*models.CoverLetter, error) {
	cl, err := s.repo.GetByID(ctx, id)
	if err != nil || cl == nil {
		return nil, fmt.Errorf("cover letter not found")
	}

	prefix := ""
	if strings.Contains(strings.ToLower(req.Instruction), "opening") || strings.Contains(strings.ToLower(req.Instruction), "intro") {
		cl.Introduction = "It is with great enthusiasm that I apply for the position. With extensive experience delivering scalable web systems, I offer immediate value."
	} else if strings.Contains(strings.ToLower(req.Instruction), "shorten") {
		cl.Body = "Throughout my career, I built resilient distributed microservices in Golang and Next.js, optimizing database query latency by 35%."
	} else {
		prefix = "Enhanced by AI Copilot: "
		cl.Body = prefix + cl.Body
	}

	if req.Tone != "" {
		cl.Tone = req.Tone
	}
	return s.UpdateCoverLetter(ctx, id, cl)
}

func (s *CoverLetterService) TailorForJob(ctx context.Context, id uuid.UUID, jobDescription string) (*models.TailorJobResponse, error) {
	cl, err := s.repo.GetByID(ctx, id)
	if err != nil || cl == nil {
		return nil, fmt.Errorf("cover letter not found")
	}

	tailored, err := s.DuplicateCoverLetter(ctx, id)
	if err == nil && tailored != nil {
		tailored.Name = fmt.Sprintf("%s (Job Tailored)", cl.Name)
		tailored.IsJobSpecific = true
		tailored.JobMatchScore = 95
		_ = s.repo.Update(ctx, tailored)
	}

	tailoredID := tailored.ID
	return &models.TailorJobResponse{
		MatchScore:               95,
		RelevantSkills:           []string{"Golang", "Next.js", "PostgreSQL", "MUI v6", "Distributed Systems"},
		RelevantExperience:       []string{"Senior Full-Stack Engineer at TechFlow Systems", "API Gateway Performance Optimization"},
		RelevantAchievements:     []string{"Boosted request throughput by 40%", "Reduced database query latency by 35%"},
		RecommendedTalkingPoints: []string{"Highlight high-concurrency Gin REST API development experience", "Emphasize accessibility compliance in Next.js MUI components"},
		SuggestedCoverLetterID:   &tailoredID,
	}, nil
}

func (s *CoverLetterService) GetTemplates(ctx context.Context) ([]models.CoverLetterTemplate, error) {
	templates, err := s.repo.GetTemplates(ctx)
	if err != nil || len(templates) == 0 {
		return []models.CoverLetterTemplate{
			{ID: "modern", Name: "Modern Glass Accent", Category: "Modern", Description: "Clean header accent styling.", RecommendedUse: "Tech, Product"},
			{ID: "minimal", Name: "Clean Minimalist", Category: "Minimal", Description: "Focuses on text elegance.", RecommendedUse: "Designers, Engineers"},
			{ID: "professional", Name: "Corporate Executive", Category: "Professional", Description: "Traditional formal layout.", RecommendedUse: "Corporate, Legal"},
			{ID: "executive", Name: "Executive Director", Category: "Executive", Description: "Tailored for VP and Director roles.", RecommendedUse: "Executive, Management"},
			{ID: "technical", Name: "Technical Specialist", Category: "Technical", Description: "Emphasizes architecture and stack.", RecommendedUse: "Software Engineers"},
			{ID: "ats", Name: "ATS Standard", Category: "ATS-Friendly", Description: "100% parseable standard layout.", RecommendedUse: "All Corporate Applications"},
		}, nil
	}
	return templates, nil
}

func (s *CoverLetterService) ListVersions(ctx context.Context, coverLetterID uuid.UUID) ([]models.CoverLetterVersion, error) {
	versions, err := s.repo.ListVersions(ctx, coverLetterID)
	if err != nil {
		return nil, err
	}
	if versions == nil {
		versions = []models.CoverLetterVersion{}
	}
	return versions, nil
}

func (s *CoverLetterService) CreateShare(ctx context.Context, userID, coverLetterID uuid.UUID, privacyLevel string) (*models.CoverLetterShare, error) {
	token := uuid.New().String()[:12]
	share := &models.CoverLetterShare{
		ID:            uuid.New(),
		CoverLetterID: coverLetterID,
		UserID:        userID,
		ShareToken:    token,
		PrivacyLevel:  privacyLevel,
		ShareURL:      fmt.Sprintf("https://kirmya.com/share/cover-letter/%s", token),
		QRCodeURL:     fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?data=https://kirmya.com/share/cover-letter/%s", token),
		IsActive:      true,
		CreatedAt:     time.Now(),
	}
	if err := s.repo.CreateShare(ctx, share); err != nil {
		return nil, err
	}
	return share, nil
}

func (s *CoverLetterService) DeleteShare(ctx context.Context, userID, coverLetterID uuid.UUID) error {
	return s.repo.DeleteShare(ctx, coverLetterID, userID)
}

func (s *CoverLetterService) GetAnalytics(ctx context.Context, coverLetterID uuid.UUID) (*models.CoverLetterAnalytics, error) {
	return s.repo.GetAnalytics(ctx, coverLetterID)
}
