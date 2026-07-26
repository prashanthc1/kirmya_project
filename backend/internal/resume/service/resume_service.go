package service

import (
	"context"
	"encoding/json"
	"fmt"
	"kirmya/internal/resume/models"
	"kirmya/internal/resume/repository"
	"strings"
	"time"

	"github.com/google/uuid"
)

type ResumeService struct {
	repo *repository.ResumeRepository
}

func NewResumeService(repo *repository.ResumeRepository) *ResumeService {
	return &ResumeService{repo: repo}
}

func (s *ResumeService) ListResumes(ctx context.Context, userID uuid.UUID) ([]models.Resume, error) {
	return s.repo.ListByUserID(ctx, userID)
}

func (s *ResumeService) GetResume(ctx context.Context, id uuid.UUID) (*models.Resume, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ResumeService) CreateResume(ctx context.Context, userID uuid.UUID, title string, template string) (*models.Resume, error) {
	rID := uuid.New()
	res := &models.Resume{
		ID:            rID,
		UserID:        userID,
		Title:         title,
		TemplateName:  template,
		IsDefault:     false,
		AtsScore:      30, // Base default score
		AiSuggestions: `["Add career summary details", "List professional experience milestones", "Add technical skills"]`,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, res); err != nil {
		return nil, err
	}

	// Initialize basic sections
	defaultSections := []string{"personal_info", "summary", "experience", "education", "skills", "certs", "projects", "achievements", "languages"}
	for i, secType := range defaultSections {
		sec := &models.ResumeSection{
			ID:          uuid.New(),
			ResumeID:    rID,
			SectionType: secType,
			Content:     "{}",
			SortOrder:   i,
		}
		_ = s.repo.CreateSection(ctx, sec)
	}

	return s.repo.GetByID(ctx, rID)
}

func (s *ResumeService) UpdateResumeSections(ctx context.Context, id uuid.UUID, sections []models.ResumeSection) (*models.Resume, error) {
	res, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if res == nil {
		return nil, fmt.Errorf("resume not found")
	}

	// Clear and write new sections
	if err := s.repo.ClearSections(ctx, id); err != nil {
		return nil, err
	}

	for _, sec := range sections {
		sec.ID = uuid.New()
		sec.ResumeID = id
		if err := s.repo.CreateSection(ctx, &sec); err != nil {
			return nil, err
		}
	}

	// AI Resume Scoring - ATS Simulation
	score, suggestions := simulateAIScoring(sections)
	res.AtsScore = score
	res.AiSuggestions = suggestions

	if err := s.repo.Update(ctx, res); err != nil {
		return nil, err
	}

	// Create and save snapshot version
	fullRes, err := s.repo.GetByID(ctx, id)
	if err == nil && fullRes != nil {
		snapshotBytes, _ := json.Marshal(fullRes)
		verTag := fmt.Sprintf("v%s", time.Now().Format("20060102-150405"))
		version := &models.ResumeVersion{
			ID:              uuid.New(),
			ResumeID:        id,
			VersionTag:      verTag,
			ContentSnapshot: string(snapshotBytes),
			AtsScore:        score,
			AiSuggestions:   suggestions,
			CreatedAt:       time.Now(),
		}
		_ = s.repo.SaveVersion(ctx, version)
	}

	return s.repo.GetByID(ctx, id)
}

func (s *ResumeService) DeleteResume(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *ResumeService) DuplicateResume(ctx context.Context, id uuid.UUID) (*models.Resume, error) {
	src, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if src == nil {
		return nil, fmt.Errorf("source resume not found")
	}

	destID := uuid.New()
	dest := &models.Resume{
		ID:            destID,
		UserID:        src.UserID,
		Title:         fmt.Sprintf("Copy of %s", src.Title),
		TemplateName:  src.TemplateName,
		IsDefault:     false,
		AtsScore:      src.AtsScore,
		AiSuggestions: src.AiSuggestions,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, dest); err != nil {
		return nil, err
	}

	// Copy sections
	for _, sec := range src.Sections {
		newSec := &models.ResumeSection{
			ID:          uuid.New(),
			ResumeID:    destID,
			SectionType: sec.SectionType,
			Content:     sec.Content,
			SortOrder:   sec.SortOrder,
		}
		_ = s.repo.CreateSection(ctx, newSec)
	}

	return s.repo.GetByID(ctx, destID)
}

func (s *ResumeService) SetDefaultResume(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	if err := s.repo.ClearDefault(ctx, userID); err != nil {
		return err
	}
	return s.repo.SetDefault(ctx, id)
}

func (s *ResumeService) ListVersions(ctx context.Context, resumeID uuid.UUID) ([]models.ResumeVersion, error) {
	return s.repo.ListVersions(ctx, resumeID)
}

// AI Scoring Helper
func simulateAIScoring(sections []models.ResumeSection) (int, string) {
	score := 40
	var suggestions []string

	hasExperience := false
	hasSkills := false
	hasCerts := false
	hasProjects := false

	for _, sec := range sections {
		if sec.Content == "" || sec.Content == "{}" {
			continue
		}
		switch sec.SectionType {
		case "summary":
			score += 15
		case "experience":
			if len(sec.Content) > 30 {
				score += 20
				hasExperience = true
			}
		case "skills":
			if strings.Contains(sec.Content, "name") {
				score += 15
				hasSkills = true
			}
		case "certs":
			score += 5
			hasCerts = true
		case "projects":
			score += 5
			hasProjects = true
		}
	}

	if !hasExperience {
		suggestions = append(suggestions, "Include professional experience description fields to improve ATS score.")
	}
	if !hasSkills {
		suggestions = append(suggestions, "List technical or professional skills.")
	}
	if !hasCerts {
		suggestions = append(suggestions, "Add relevant industry certifications.")
	}
	if !hasProjects {
		suggestions = append(suggestions, "Link your GitHub or personal portfolio projects.")
	}

	if score > 100 {
		score = 100
	}

	if len(suggestions) == 0 {
		suggestions = append(suggestions, "Your resume looks ready for ATS review!")
	}

	sugBytes, _ := json.Marshal(suggestions)
	return score, string(sugBytes)
}
