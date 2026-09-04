package service

import (
	"context"
	"testing"

	"kirmya/internal/search/domain"
	"kirmya/internal/search/repository"

	"github.com/google/uuid"
)

func TestSearchCandidatesFlow(t *testing.T) {
	svc := NewSearchService(nil, nil, nil)

	q := domain.CandidateSearchQuery{
		Query:       "Golang Microservices",
		BooleanMode: true,
		City:        "Dubai",
		Page:        1,
		Limit:       10,
	}

	resp, err := svc.SearchCandidates(context.Background(), q)
	if err != nil {
		t.Fatalf("Expected no error searching candidates, got %v", err)
	}

	if resp.TotalResults == 0 {
		t.Errorf("Expected candidate results, got %d", resp.TotalResults)
	}

	if resp.Candidates[0].Name != "Sarah Chen" {
		t.Errorf("Expected first candidate 'Sarah Chen', got %s", resp.Candidates[0].Name)
	}

	if resp.Candidates[0].AIMatch.OverallScore != 96 {
		t.Errorf("Expected AI match score 96, got %d", resp.Candidates[0].AIMatch.OverallScore)
	}
}

func TestTalentPoolsFlow(t *testing.T) {
	svc := NewSearchService(nil, nil, nil)
	recruiterID := uuid.New()

	pools, err := svc.GetTalentPools(context.Background(), recruiterID)
	if err != nil {
		t.Fatalf("Expected no error fetching talent pools, got %v", err)
	}

	if len(pools) != 2 {
		t.Errorf("Expected 2 talent pools, got %d", len(pools))
	}

	newPool, err := svc.CreateTalentPool(context.Background(), recruiterID, "Frontend Leads", "React and Next.js engineers", true)
	if err != nil {
		t.Fatalf("Expected no error creating talent pool, got %v", err)
	}

	if newPool.Name != "Frontend Leads" {
		t.Errorf("Expected pool name 'Frontend Leads', got %s", newPool.Name)
	}
}

func TestCandidateComparisonFlow(t *testing.T) {
	svc := NewSearchService(nil, nil, nil)
	ids := []uuid.UUID{uuid.New(), uuid.New()}

	matrix, err := svc.CompareCandidates(context.Background(), ids)
	if err != nil {
		t.Fatalf("Expected no error comparing candidates, got %v", err)
	}

	if len(matrix) != 2 {
		t.Errorf("Expected 2 candidate comparison items, got %d", len(matrix))
	}
}

func TestNormalizeQuery(t *testing.T) {
	svc := NewSearchService(nil, nil, nil)
	tests := []struct {
		input    string
		expected string
	}{
		{"  Go Backend Engineer  ", "go backend engineer"},
		{"!!Stripe Global??", "stripe global"},
		{"#Golang & PostgreSQL$", "golang & postgresql"},
		{"   ", ""},
	}

	for _, tt := range tests {
		got := svc.NormalizeQuery(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizeQuery(%q) = %q, expected %q", tt.input, got, tt.expected)
		}
	}
}

func TestSearchWithFilters(t *testing.T) {
	repo := repository.NewSearchRepository(nil)
	svc := NewSearchService(repo, nil, nil)
	userID := uuid.New()

	resp, err := svc.Search(context.Background(), userID, "!!Go!!", domain.CategoryJobs)
	if err != nil {
		t.Fatalf("Expected no error performing search, got %v", err)
	}

	if resp.Query != "go" {
		t.Errorf("Expected normalized query 'go', got %q", resp.Query)
	}

	if len(resp.Results) == 0 {
		t.Errorf("Expected search results, got 0")
	}

	history, err := svc.GetUserHistory(context.Background(), userID)
	if err != nil {
		t.Fatalf("Expected no error getting user history, got %v", err)
	}
	if len(history) == 0 {
		t.Errorf("Expected saved history entry after search")
	}
}

func TestDeleteSearchHistoryItem(t *testing.T) {
	repo := repository.NewSearchRepository(nil)
	svc := NewSearchService(repo, nil, nil)
	userID := uuid.New()

	historyItem := &domain.SearchHistoryItem{
		ID:           uuid.New(),
		UserID:       userID,
		Query:        "react lead",
		ResultsCount: 5,
	}
	_ = repo.SaveSearchHistory(context.Background(), historyItem)

	historyBefore, _ := svc.GetUserHistory(context.Background(), userID)
	if len(historyBefore) == 0 {
		t.Fatalf("Expected history before deletion")
	}

	err := svc.DeleteHistoryItem(context.Background(), userID, historyItem.ID)
	if err != nil {
		t.Fatalf("Expected no error deleting history item, got %v", err)
	}

	historyAfter, _ := svc.GetUserHistory(context.Background(), userID)
	for _, item := range historyAfter {
		if item.ID == historyItem.ID {
			t.Errorf("History item with ID %s was not deleted", historyItem.ID)
		}
	}

	errClear := svc.ClearUserHistory(context.Background(), userID)
	if errClear != nil {
		t.Fatalf("Expected no error clearing user history, got %v", errClear)
	}

	historyCleared, _ := svc.GetUserHistory(context.Background(), userID)
	if len(historyCleared) != 0 {
		t.Errorf("Expected 0 history items after clear, got %d", len(historyCleared))
	}
}

func TestReindexEntities(t *testing.T) {
	svc := NewSearchService(nil, nil, nil)

	countSingle, err := svc.ReindexEntities(context.Background(), "jobs", "job-123")
	if err != nil || countSingle != 1 {
		t.Errorf("Expected count 1 for single entity reindex, got count %d, err %v", countSingle, err)
	}

	countJobs, err := svc.ReindexEntities(context.Background(), "jobs", "")
	if err != nil || countJobs != 100 {
		t.Errorf("Expected count 100 for jobs reindex, got count %d, err %v", countJobs, err)
	}

	countAll, err := svc.ReindexEntities(context.Background(), "all", "")
	if err != nil || countAll != 225 {
		t.Errorf("Expected count 225 for all entities reindex, got count %d, err %v", countAll, err)
	}
}

