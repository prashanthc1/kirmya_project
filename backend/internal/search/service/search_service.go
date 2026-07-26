package service

import (
	"context"
	"strings"

	"kirmya/internal/search/adapter"
	"kirmya/internal/search/domain"
	"kirmya/internal/search/repository"

	"github.com/google/uuid"
)

type SearchService interface {
	Search(ctx context.Context, userID uuid.UUID, query, category string) (*domain.SearchResponse, error)
	GetSuggestions(ctx context.Context, query string) ([]domain.SearchSuggestion, error)
	GetUserHistory(ctx context.Context, userID uuid.UUID) ([]domain.SearchHistoryItem, error)
	SavePreference(ctx context.Context, userID uuid.UUID, payload domain.SaveSearchPreferencePayload) (*domain.SearchPreference, error)
}

type searchService struct {
	repo          repository.SearchRepository
	searchAdapter adapter.SearchEngineAdapter
}

func NewSearchService(repo repository.SearchRepository, searchAdapter adapter.SearchEngineAdapter) SearchService {
	return &searchService{
		repo:          repo,
		searchAdapter: searchAdapter,
	}
}

func (s *searchService) Search(ctx context.Context, userID uuid.UUID, query, category string) (*domain.SearchResponse, error) {
	results, counts, err := s.searchAdapter.ExecuteSearch(ctx, query, category)
	if err != nil {
		return nil, err
	}

	if query != "" {
		historyItem := &domain.SearchHistoryItem{
			ID:             uuid.New(),
			UserID:         userID,
			Query:          query,
			CategoryFilter: category,
			ResultsCount:   len(results),
		}
		_ = s.repo.SaveSearchHistory(ctx, historyItem)
	}

	return &domain.SearchResponse{
		Query:            query,
		Category:         category,
		TotalResults:     len(results),
		EngineUsed:       s.searchAdapter.GetEngineName(),
		Results:          results,
		CategoriesCounts: counts,
	}, nil
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
