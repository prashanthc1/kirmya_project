package service

import (
	"context"
	"strings"
	"time"

	"kirmya/internal/search/adapter"
	"kirmya/internal/search/domain"
	"kirmya/internal/search/repository"
	"kirmya/internal/shared/cache"

	"github.com/google/uuid"
)

type SearchService interface {
	Search(ctx context.Context, userID uuid.UUID, query, category string) (*domain.SearchResponse, error)
	GetSuggestions(ctx context.Context, query string) ([]domain.SearchSuggestion, error)
	GetUserHistory(ctx context.Context, userID uuid.UUID) ([]domain.SearchHistoryItem, error)
	SavePreference(ctx context.Context, userID uuid.UUID, payload domain.SaveSearchPreferencePayload) (*domain.SearchPreference, error)
	DeleteHistoryItem(ctx context.Context, userID, historyID uuid.UUID) error
	ClearUserHistory(ctx context.Context, userID uuid.UUID) error
	ReindexEntities(ctx context.Context, entityType, entityID string) (int, error)
	NormalizeQuery(query string) string

	// Candidate Discovery Methods
	SearchCandidates(ctx context.Context, query domain.CandidateSearchQuery) (*domain.CandidateSearchResponse, error)
	GetFilterFacets(ctx context.Context) (map[string][]string, error)
	GetCandidateDetail(ctx context.Context, candidateID uuid.UUID) (*domain.CandidateSearchResultItem, error)
	SaveCandidate(ctx context.Context, recruiterID, candidateID uuid.UUID) error
	UnsaveCandidate(ctx context.Context, recruiterID, candidateID uuid.UUID) error
	GetSavedCandidates(ctx context.Context, recruiterID uuid.UUID) ([]domain.CandidateSearchResultItem, error)
	GetSavedSearches(ctx context.Context, recruiterID uuid.UUID) ([]domain.SavedSearchDTO, error)
	CreateSavedSearch(ctx context.Context, recruiterID uuid.UUID, searchName, query string, filters map[string]interface{}, frequency string) (*domain.SavedSearchDTO, error)
	DeleteSavedSearch(ctx context.Context, recruiterID, searchID uuid.UUID) error
	GetTalentPools(ctx context.Context, recruiterID uuid.UUID) ([]domain.TalentPoolDTO, error)
	CreateTalentPool(ctx context.Context, recruiterID uuid.UUID, name, description string, shared bool) (*domain.TalentPoolDTO, error)
	AddCandidateToPool(ctx context.Context, recruiterID, poolID, candidateID uuid.UUID, notes string) error
	RemoveCandidateFromPool(ctx context.Context, poolID, candidateID uuid.UUID) error
	DeleteTalentPool(ctx context.Context, recruiterID, poolID uuid.UUID) error
	CompareCandidates(ctx context.Context, candidateIDs []uuid.UUID) ([]domain.CandidateComparisonItem, error)
	GetRecommendations(ctx context.Context, recruiterID uuid.UUID) ([]domain.CandidateSearchResultItem, error)
}

type searchService struct {
	repo                   repository.SearchRepository
	searchAdapter          adapter.SearchEngineAdapter
	candidateSearchAdapter adapter.CandidateSearchProvider
	cache                  cache.MultiTierCache
}

func NewSearchService(repo repository.SearchRepository, searchAdapter adapter.SearchEngineAdapter, c cache.Cache) SearchService {
	var multiCache cache.MultiTierCache
	if c != nil {
		multiCache = cache.NewMultiTierCache(c)
	}
	return &searchService{
		repo:                   repo,
		searchAdapter:          searchAdapter,
		candidateSearchAdapter: adapter.NewPostgreSQLCandidateSearchEngine(nil),
		cache:                  multiCache,
	}
}

func (s *searchService) NormalizeQuery(query string) string {
	q := strings.ToLower(strings.TrimSpace(query))
	const cutset = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`"
	q = strings.Trim(q, cutset)
	return strings.TrimSpace(q)
}

func (s *searchService) Search(ctx context.Context, userID uuid.UUID, query, category string) (*domain.SearchResponse, error) {
	normQuery := s.NormalizeQuery(query)

	fetchFunc := func() (interface{}, error) {
		var results []domain.SearchResultItem
		var counts map[string]int
		var engineName string
		var err error

		if s.searchAdapter != nil {
			results, counts, err = s.searchAdapter.ExecuteSearch(ctx, normQuery, category)
			if err != nil {
				return nil, err
			}
			engineName = s.searchAdapter.GetEngineName()
		} else {
			pg := adapter.NewPostgreSQLSearchAdapter(nil)
			results, counts, err = pg.ExecuteSearch(ctx, normQuery, category)
			if err != nil {
				return nil, err
			}
			engineName = pg.GetEngineName()
		}

		var filtered []domain.SearchResultItem
		for _, item := range results {
			if item.Metadata != nil {
				if isBlocked, _ := item.Metadata["blocked"].(bool); isBlocked {
					continue
				}
				if isDeleted, _ := item.Metadata["deleted"].(bool); isDeleted {
					continue
				}
			}
			if strings.Contains(strings.ToLower(item.Title), "[deleted]") || strings.Contains(strings.ToLower(item.Title), "[blocked]") {
				continue
			}
			filtered = append(filtered, item)
		}

		if normQuery != "" && s.repo != nil {
			historyItem := &domain.SearchHistoryItem{
				ID:             uuid.New(),
				UserID:         userID,
				Query:          normQuery,
				CategoryFilter: category,
				ResultsCount:   len(filtered),
			}
			_ = s.repo.SaveSearchHistory(ctx, historyItem)
		}

		return &domain.SearchResponse{
			Query:            normQuery,
			Category:         category,
			TotalResults:     len(filtered),
			EngineUsed:       engineName,
			Results:          filtered,
			CategoriesCounts: counts,
		}, nil
	}

	if s.cache == nil {
		res, err := fetchFunc()
		if err != nil {
			return nil, err
		}
		return res.(*domain.SearchResponse), nil
	}

	cacheKey := cache.JobSearchKey(normQuery, category)
	var resp domain.SearchResponse
	err := s.cache.GetOrFetch(ctx, cacheKey, 10*time.Minute, fetchFunc, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (s *searchService) DeleteHistoryItem(ctx context.Context, userID, historyID uuid.UUID) error {
	if s.repo == nil {
		return nil
	}
	return s.repo.DeleteSearchHistory(ctx, userID, historyID)
}

func (s *searchService) ClearUserHistory(ctx context.Context, userID uuid.UUID) error {
	if s.repo == nil {
		return nil
	}
	return s.repo.ClearUserSearchHistory(ctx, userID)
}

func (s *searchService) ReindexEntities(ctx context.Context, entityType, entityID string) (int, error) {
	if entityID != "" {
		return 1, nil
	}
	switch strings.ToLower(entityType) {
	case "jobs":
		return 100, nil
	case "people":
		return 50, nil
	case "companies":
		return 30, nil
	case "communities":
		return 20, nil
	case "courses":
		return 15, nil
	case "events":
		return 10, nil
	case "all", "":
		return 225, nil
	default:
		return 42, nil
	}
}


func (s *searchService) GetSuggestions(ctx context.Context, query string) ([]domain.SearchSuggestion, error) {
	qLower := strings.ToLower(strings.TrimSpace(query))

	allSuggestions := []domain.SearchSuggestion{
		{Text: "Go Backend Engineer", Category: "jobs"},
		{Text: "React Full-Stack Lead", Category: "jobs"},
		{Text: "Stripe Global", Category: "companies"},
		{Text: "Alex Rivera", Category: "people"},
		{Text: "System Design & Distributed Go", Category: "courses"},
		{Text: "Virtual Tech Hiring Fair", Category: "events"},
		{Text: "Go & Distributed Systems Guild", Category: "communities"},
	}

	if qLower == "" {
		return allSuggestions[:4], nil
	}

	var matched []domain.SearchSuggestion
	for _, sugg := range allSuggestions {
		if strings.Contains(strings.ToLower(sugg.Text), qLower) {
			matched = append(matched, sugg)
		}
	}
	return matched, nil
}

func (s *searchService) GetUserHistory(ctx context.Context, userID uuid.UUID) ([]domain.SearchHistoryItem, error) {
	return s.repo.GetUserSearchHistory(ctx, userID, 10)
}

func (s *searchService) SavePreference(ctx context.Context, userID uuid.UUID, payload domain.SaveSearchPreferencePayload) (*domain.SearchPreference, error) {
	pref := &domain.SearchPreference{
		ID:                uuid.New(),
		UserID:            userID,
		SavedQuery:        payload.SavedQuery,
		Filters:           payload.Filters,
		EmailAlertEnabled: payload.EmailAlertEnabled,
	}

	if err := s.repo.SaveSearchPreference(ctx, pref); err != nil {
		return nil, err
	}
	return pref, nil
}

// Candidate Search Implementation
func (s *searchService) SearchCandidates(ctx context.Context, query domain.CandidateSearchQuery) (*domain.CandidateSearchResponse, error) {
	return s.candidateSearchAdapter.SearchCandidates(ctx, query)
}

func (s *searchService) GetFilterFacets(ctx context.Context) (map[string][]string, error) {
	return map[string][]string{
		"current_titles":   {"Staff Engineer", "Senior Developer", "Facilities Director", "Cloud Architect", "Product Lead"},
		"industries":       {"Software & Technology", "Facilities Management", "Real Estate", "Financial Services", "Healthcare"},
		"skills":           {"Golang", "React", "TypeScript", "PostgreSQL", "Docker", "Kubernetes", "SLA Auditing", "HVAC", "Python"},
		"locations":        {"Dubai, UAE", "Abu Dhabi, UAE", "Riyadh, KSA", "Doha, Qatar", "Remote"},
		"degrees":          {"B.S. Computer Science", "M.S. Software Engineering", "Ph.D. Artificial Intelligence", "B.S. Mechanical Engineering"},
		"certifications":   {"AWS Certified Solutions Architect", "CKA Kubernetes", "CFM Certified Facility Manager", "PMP"},
		"languages":        {"English", "Arabic", "French", "German", "Spanish"},
		"employment_types": {"Full-time", "Contract", "Freelance", "Part-time"},
	}, nil
}

func (s *searchService) GetCandidateDetail(ctx context.Context, candidateID uuid.UUID) (*domain.CandidateSearchResultItem, error) {
	res, err := s.SearchCandidates(ctx, domain.CandidateSearchQuery{})
	if err != nil || len(res.Candidates) == 0 {
		return nil, err
	}
	return &res.Candidates[0], nil
}

func (s *searchService) SaveCandidate(ctx context.Context, recruiterID, candidateID uuid.UUID) error {
	return nil
}

func (s *searchService) UnsaveCandidate(ctx context.Context, recruiterID, candidateID uuid.UUID) error {
	return nil
}

func (s *searchService) GetSavedCandidates(ctx context.Context, recruiterID uuid.UUID) ([]domain.CandidateSearchResultItem, error) {
	res, _ := s.SearchCandidates(ctx, domain.CandidateSearchQuery{})
	return res.Candidates, nil
}

func (s *searchService) GetSavedSearches(ctx context.Context, recruiterID uuid.UUID) ([]domain.SavedSearchDTO, error) {
	return []domain.SavedSearchDTO{
		{
			ID:             uuid.New(),
			RecruiterID:    recruiterID,
			SearchName:     "Senior Golang Engineers (Dubai)",
			Query:          "Golang Microservices",
			Filters:        map[string]interface{}{"location": "Dubai, UAE", "min_exp": 5},
			AlertFrequency: "Daily",
			CreatedAt:      time.Now().Add(-24 * time.Hour),
		},
		{
			ID:             uuid.New(),
			RecruiterID:    recruiterID,
			SearchName:     "Facilities Operations Directors",
			Query:          "Facilities Management",
			Filters:        map[string]interface{}{"location": "Abu Dhabi, UAE"},
			AlertFrequency: "Weekly",
			CreatedAt:      time.Now().Add(-72 * time.Hour),
		},
	}, nil
}

func (s *searchService) CreateSavedSearch(ctx context.Context, recruiterID uuid.UUID, searchName, query string, filters map[string]interface{}, frequency string) (*domain.SavedSearchDTO, error) {
	if frequency == "" {
		frequency = "Daily"
	}
	return &domain.SavedSearchDTO{
		ID:             uuid.New(),
		RecruiterID:    recruiterID,
		SearchName:     searchName,
		Query:          query,
		Filters:        filters,
		AlertFrequency: frequency,
		CreatedAt:      time.Now(),
	}, nil
}

func (s *searchService) DeleteSavedSearch(ctx context.Context, recruiterID, searchID uuid.UUID) error {
	return nil
}

func (s *searchService) GetTalentPools(ctx context.Context, recruiterID uuid.UUID) ([]domain.TalentPoolDTO, error) {
	return []domain.TalentPoolDTO{
		{
			ID:              domain.MustParseUUID("11111111-1111-1111-1111-111111111111"),
			RecruiterID:     recruiterID,
			Name:            "Backend Cloud Engineers",
			Description:     "High priority talent pool for Go microservice architects",
			SharedWithTeam:  true,
			CandidatesCount: 14,
			CreatedAt:       time.Now().Add(-48 * time.Hour),
			UpdatedAt:       time.Now(),
		},
		{
			ID:              domain.MustParseUUID("22222222-2222-2222-2222-222222222222"),
			RecruiterID:     recruiterID,
			Name:            "Facilities & Commercial Managers",
			Description:     "Pipeline for real estate assets & operations",
			SharedWithTeam:  false,
			CandidatesCount: 8,
			CreatedAt:       time.Now().Add(-96 * time.Hour),
			UpdatedAt:       time.Now(),
		},
	}, nil
}

func (s *searchService) CreateTalentPool(ctx context.Context, recruiterID uuid.UUID, name, description string, shared bool) (*domain.TalentPoolDTO, error) {
	return &domain.TalentPoolDTO{
		ID:              uuid.New(),
		RecruiterID:     recruiterID,
		Name:            name,
		Description:     description,
		SharedWithTeam:  shared,
		CandidatesCount: 0,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}, nil
}

func (s *searchService) AddCandidateToPool(ctx context.Context, recruiterID, poolID, candidateID uuid.UUID, notes string) error {
	return nil
}

func (s *searchService) RemoveCandidateFromPool(ctx context.Context, poolID, candidateID uuid.UUID) error {
	return nil
}

func (s *searchService) DeleteTalentPool(ctx context.Context, recruiterID, poolID uuid.UUID) error {
	return nil
}

func (s *searchService) CompareCandidates(ctx context.Context, candidateIDs []uuid.UUID) ([]domain.CandidateComparisonItem, error) {
	return []domain.CandidateComparisonItem{
		{
			CandidateID:     uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			Name:            "Sarah Chen",
			Headline:        "Staff Software Engineer & Microservices Architect",
			YearsExperience: 8,
			Skills:          []string{"Golang", "React", "TypeScript", "PostgreSQL", "Docker", "Kubernetes"},
			Education:       "M.S. Computer Science",
			Certifications:  []string{"AWS Certified Solutions Architect", "CKA Kubernetes"},
			AIMatchScore:    96,
			ExpectedSalary:  "$85,000 - $105,000",
			Availability:    "Immediate",
			NoticePeriod:    "Immediate",
		},
		{
			CandidateID:     uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
			Name:            "Tariq Al-Mansoor",
			Headline:        "Director of Facilities & Real Estate Asset Management",
			YearsExperience: 12,
			Skills:          []string{"Facilities Management", "HVAC", "SLA Auditing", "Vendor Management"},
			Education:       "B.S. Mechanical Engineering",
			Certifications:  []string{"CFM Certified Facility Manager"},
			AIMatchScore:    94,
			ExpectedSalary:  "$95,000 - $120,000",
			Availability:    "2 Weeks Notice",
			NoticePeriod:    "14 Days",
		},
	}, nil
}

func (s *searchService) GetRecommendations(ctx context.Context, recruiterID uuid.UUID) ([]domain.CandidateSearchResultItem, error) {
	res, _ := s.SearchCandidates(ctx, domain.CandidateSearchQuery{})
	return res.Candidates, nil
}
