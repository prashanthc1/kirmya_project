package adapter

import (
	"context"
	"testing"

	"kirmya/internal/search/domain"
)

func TestPostgreSQLSearchAdapter_MockSearch(t *testing.T) {
	adapter := NewPostgreSQLSearchAdapter(nil)

	if name := adapter.GetEngineName(); name != "postgresql-tsvector-v1" {
		t.Errorf("Expected engine name 'postgresql-tsvector-v1', got %s", name)
	}

	// 1. Search All with empty query
	results, counts, err := adapter.ExecuteSearch(context.Background(), "", domain.CategoryAll)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) == 0 {
		t.Fatalf("Expected results for empty query on all categories, got 0")
	}
	if counts[domain.CategoryJobs] == 0 || counts[domain.CategoryPeople] == 0 {
		t.Errorf("Expected positive category counts, got %+v", counts)
	}

	// 2. Search specific keyword
	resultsGo, countsGo, err := adapter.ExecuteSearch(context.Background(), "Go", domain.CategoryAll)
	if err != nil {
		t.Fatalf("Expected no error for 'Go' search, got %v", err)
	}
	if len(resultsGo) == 0 {
		t.Errorf("Expected results for 'Go' search, got 0")
	}
	// Verify highest relevance score is ranked first
	for i := 1; i < len(resultsGo); i++ {
		if resultsGo[i].Score > resultsGo[i-1].Score {
			t.Errorf("Results not sorted by score descending: index %d (%f) > index %d (%f)",
				i, resultsGo[i].Score, i-1, resultsGo[i-1].Score)
		}
	}
	_ = countsGo

	// 3. Category Filter: Jobs only
	jobResults, jobCounts, err := adapter.ExecuteSearch(context.Background(), "", domain.CategoryJobs)
	if err != nil {
		t.Fatalf("Expected no error for jobs filter, got %v", err)
	}
	for _, item := range jobResults {
		if item.Type != domain.CategoryJobs {
			t.Errorf("Expected only 'jobs' items, got item type %s (id: %s)", item.Type, item.ID)
		}
	}
	if jobCounts[domain.CategoryPeople] != 0 {
		t.Errorf("Expected 0 people count when filtering by jobs, got %d", jobCounts[domain.CategoryPeople])
	}
}

func TestOpenSearchAdapter_FallbackMechanics(t *testing.T) {
	mockPgAdapter := NewPostgreSQLSearchAdapter(nil)

	// 1. Empty cluster URL -> immediate fallback to PostgreSQL
	osEmpty := NewOpenSearchAdapter("", mockPgAdapter)
	if osEmpty.GetEngineName() != "opensearch-cluster-v2" {
		t.Errorf("Expected engine name 'opensearch-cluster-v2', got %s", osEmpty.GetEngineName())
	}

	resultsEmpty, _, errEmpty := osEmpty.ExecuteSearch(context.Background(), "Engineer", domain.CategoryAll)
	if errEmpty != nil {
		t.Fatalf("Expected no error on empty cluster URL fallback, got %v", errEmpty)
	}
	if len(resultsEmpty) == 0 {
		t.Errorf("Expected fallback results from PostgreSQL adapter, got 0")
	}

	// 2. Unreachable cluster URL -> automatic timeout & graceful fallback
	osUnreachable := NewOpenSearchAdapter("http://127.0.0.1:54399", mockPgAdapter)
	resultsUnreachable, _, errUnreachable := osUnreachable.ExecuteSearch(context.Background(), "Engineer", domain.CategoryAll)
	if errUnreachable != nil {
		t.Fatalf("Expected no error when OpenSearch is unreachable (should fallback gracefully), got %v", errUnreachable)
	}
	if len(resultsUnreachable) == 0 {
		t.Errorf("Expected fallback results from PostgreSQL adapter when OpenSearch unreachable, got 0")
	}
}

func TestCandidateSearchProvider(t *testing.T) {
	engine := NewPostgreSQLCandidateSearchEngine(nil)

	if name := engine.EngineName(); name != "postgresql-tsvector-v2" {
		t.Errorf("Expected candidate engine name 'postgresql-tsvector-v2', got %s", name)
	}

	resp, err := engine.SearchCandidates(context.Background(), domain.CandidateSearchQuery{
		Query: "Golang",
		Page:  1,
		Limit: 10,
	})
	if err != nil {
		t.Fatalf("Expected no error searching candidates, got %v", err)
	}
	if resp.TotalResults == 0 {
		t.Errorf("Expected candidate results, got 0")
	}
	if len(resp.Candidates) == 0 {
		t.Errorf("Expected candidates slice to be non-empty")
	}
	if resp.Facets == nil || len(resp.Facets["skills"]) == 0 {
		t.Errorf("Expected skills facets in candidate search response")
	}
}
