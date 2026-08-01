package service

import (
	"context"
	"testing"

	"kirmya/internal/search/domain"

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

	if resp.TotalResults != 3 {
		t.Errorf("Expected 3 candidate results, got %d", resp.TotalResults)
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
