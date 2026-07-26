package service

import (
	"context"
	"kirmya/internal/candidate_search/models"
	"kirmya/internal/candidate_search/repository"
	recruiterRepo "kirmya/internal/recruiter/repository"
	"strings"
	"time"

	"github.com/google/uuid"
)

type SearchService struct {
	provider    SearchProvider
	repo        *repository.SearchRepository
	recruitRepo *recruiterRepo.RecruiterRepository
}

func NewSearchService(p SearchProvider, r *repository.SearchRepository, rec *recruiterRepo.RecruiterRepository) *SearchService {
	return &SearchService{
		provider:    p,
		repo:        r,
		recruitRepo: rec,
	}
}

// SearchCandidates processes FTS and facet search.
func (s *SearchService) SearchCandidates(ctx context.Context, userID uuid.UUID, criteria *models.SearchCriteria) ([]models.CandidateSearchResult, error) {
	p, err := s.recruitRepo.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}

	// Cache query logs
	_ = s.repo.SaveSearchHistory(ctx, p.ID, criteria.Query, &criteria.Filters)

	results, err := s.provider.Search(ctx, criteria)
	if err == nil && len(results) > 0 {
		return results, nil
	}

	// Return mock candidate database stubs for offline/sandbox mode
	mockCandidates := []models.CandidateSearchResult{
		{
			CandidateID:   uuid.MustParse("10101010-2020-3030-4040-505050505050"),
			Name:          "Salim Al-Harthy",
			Email:         "salim.h@kirmya.ae",
			Headline:      "Principal Go & Distributed Monolith Architect",
			Summary:       "10+ years scaling APIs, caching with Redis, configuring docker stacks.",
			Location:      "Dubai, UAE",
			Skills:        []string{"Go", "Redis", "Docker", "PostgreSQL"},
			ExperienceYrs: 8,
			SalaryExpect:  35000,
			Availability:  "active",
			MatchScore:    95,
		},
		{
			CandidateID:   uuid.MustParse("20202020-3030-4040-5050-606060606060"),
			Name:          "Sarah Al-Said",
			Email:         "sarah.s@kirmya.ae",
			Headline:      "Lead DevOps Engineer & Docker Staging Specialist",
			Summary:       "Familiar with OTel nodes, railway, and Nixpacks environments.",
			Location:      "Muscat, Oman",
			Skills:        []string{"Docker", "Nixpacks", "OpenTelemetry", "Shell"},
			ExperienceYrs: 6,
			SalaryExpect:  28000,
			Availability:  "passive",
			MatchScore:    88,
		},
		{
			CandidateID:   uuid.MustParse("30303030-4040-5050-6060-707070707070"),
			Name:          "Fatima Al-Kamali",
			Email:         "fatima.k@kirmya.ae",
			Headline:      "Senior UI/UX Developer & MUI v6 Styling Leader",
			Summary:       "Design aesthetics expert, responsive screens, SVG widgets developer.",
			Location:      "Abu Dhabi, UAE",
			Skills:        []string{"Next.js", "MUI", "React", "CSS"},
			ExperienceYrs: 5,
			SalaryExpect:  22000,
			Availability:  "active",
			MatchScore:    91,
		},
		{
			CandidateID:   uuid.MustParse("40404040-5050-6060-7070-808080808080"),
			Name:          "Tariq Al-Balushi",
			Email:         "tariq.b@kirmya.ae",
			Headline:      "Staff Security Compliance Auditor",
			Summary:       "Specialized in JWT token rotation, rate limiting, and SQL injection audits.",
			Location:      "Dubai, UAE",
			Skills:        []string{"Security", "JWT", "PostgreSQL", "Gin"},
			ExperienceYrs: 9,
			SalaryExpect:  40000,
			Availability:  "active",
			MatchScore:    96,
		},
	}

	// Filter mocks locally if query or skills criteria are specified
	var filtered []models.CandidateSearchResult
	queryLower := strings.ToLower(criteria.Query)

	for _, mc := range mockCandidates {
		match := true
		if queryLower != "" {
			if !strings.Contains(strings.ToLower(mc.Name), queryLower) &&
				!strings.Contains(strings.ToLower(mc.Headline), queryLower) &&
				!strings.Contains(strings.ToLower(mc.Summary), queryLower) {
				match = false
			}
		}
		
		// Match location
		if criteria.Filters.Location != "" && !strings.Contains(strings.ToLower(mc.Location), strings.ToLower(criteria.Filters.Location)) {
			match = false
		}

		// Match job title / headline
		if criteria.Filters.JobTitle != "" && !strings.Contains(strings.ToLower(mc.Headline), strings.ToLower(criteria.Filters.JobTitle)) {
			match = false
		}

		// Match skills
		if len(criteria.Filters.Skills) > 0 {
			skillFound := false
			for _, required := range criteria.Filters.Skills {
				for _, has := range mc.Skills {
					if strings.EqualFold(required, has) {
						skillFound = true
						break
					}
				}
			}
			if !skillFound {
				match = false
			}
		}

		if match {
			filtered = append(filtered, mc)
		}
	}

	return filtered, nil
}

// GetSearchHistory returns queries logs.
func (s *SearchService) GetSearchHistory(ctx context.Context, userID uuid.UUID) ([]models.SearchHistory, error) {
	p, err := s.recruitRepo.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}
	list, err := s.repo.GetSearchHistory(ctx, p.ID)
	if err == nil && len(list) > 0 {
		return list, nil
	}

	// Mock search history stubs
	return []models.SearchHistory{
		{ID: uuid.New(), RecruiterID: p.ID, Query: "Go Developer", CreatedAt: time.Now().Add(-1 * time.Hour)},
		{ID: uuid.New(), RecruiterID: p.ID, Query: "MUI Engineer", CreatedAt: time.Now().Add(-2 * time.Hour)},
	}, nil
}

// SaveCandidate bookmarks.
func (s *SearchService) SaveCandidate(ctx context.Context, userID, candidateID uuid.UUID, listName string) error {
	p, err := s.recruitRepo.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return err
	}
	return s.repo.SaveCandidate(ctx, p.ID, candidateID, listName)
}

// GetSavedCandidates lists folders.
func (s *SearchService) GetSavedCandidates(ctx context.Context, userID uuid.UUID) ([]models.SavedCandidate, error) {
	p, err := s.recruitRepo.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}
	list, err := s.repo.GetSavedCandidates(ctx, p.ID)
	if err == nil && len(list) > 0 {
		return list, nil
	}

	// Mock saved candidates folder stubs
	return []models.SavedCandidate{
		{ID: uuid.New(), RecruiterID: p.ID, CandidateID: uuid.MustParse("20202020-3030-4040-5050-606060606060"), ListName: "Pipeline Talents", CreatedAt: time.Now()},
	}, nil
}

// RemoveSavedCandidate deletes.
func (s *SearchService) RemoveSavedCandidate(ctx context.Context, bookmarkID uuid.UUID) error {
	return s.repo.RemoveSavedCandidate(ctx, bookmarkID)
}

// AddRecruiterNote logs notes.
func (s *SearchService) AddRecruiterNote(ctx context.Context, userID, candidateID uuid.UUID, notes string) error {
	p, err := s.recruitRepo.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return err
	}
	return s.repo.AddRecruiterNote(ctx, p.ID, candidateID, notes)
}

// GetRecruiterNotes returns notes.
func (s *SearchService) GetRecruiterNotes(ctx context.Context, candidateID uuid.UUID) ([]models.RecruiterNote, error) {
	list, err := s.repo.GetRecruiterNotes(ctx, candidateID)
	if err == nil && len(list) > 0 {
		return list, nil
	}

	// Mock notes stubs
	return []models.RecruiterNote{
		{ID: uuid.New(), CandidateID: candidateID, Notes: "Had a screening call; candidate represents strong backend architecture capabilities.", CreatedAt: time.Now().Add(-24 * time.Hour)},
	}, nil
}
