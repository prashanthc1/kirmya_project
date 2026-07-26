package service

import (
	"context"
	"kirmya/internal/candidate_search/models"
	"kirmya/internal/candidate_search/repository"
	recruiterRepo "kirmya/internal/recruiter/repository"
	"testing"

	"github.com/google/uuid"
)

func TestSearchCandidatesOffline(t *testing.T) {
	provider := NewPostgresSearchProvider(nil)
	repo := repository.NewSearchRepository(nil)
	recRepo := recruiterRepo.NewRecruiterRepository(nil)
	svc := NewSearchService(provider, repo, recRepo)

	userID := uuid.New()
	criteria := &models.SearchCriteria{
		Query: "Go",
		Filters: models.SearchFilters{
			Skills:   []string{"Go"},
			Location: "Dubai, UAE",
		},
	}

	results, err := svc.SearchCandidates(context.Background(), userID, criteria)
	if err != nil {
		t.Fatalf("Expected no error searching candidates, got %v", err)
	}

	if len(results) == 0 {
		t.Errorf("Expected mock search results to be generated, got 0 results")
	}

	if results[0].Name != "Salim Al-Harthy" {
		t.Errorf("Expected first match to be Salim Al-Harthy, got %s", results[0].Name)
	}
}

func TestSaveAndRemoveSavedCandidate(t *testing.T) {
	provider := NewPostgresSearchProvider(nil)
	repo := repository.NewSearchRepository(nil)
	recRepo := recruiterRepo.NewRecruiterRepository(nil)
	svc := NewSearchService(provider, repo, recRepo)

	userID := uuid.New()
	candidateID := uuid.New()

	// Should succeed without error in mock fallback mode
	err := svc.SaveCandidate(context.Background(), userID, candidateID, "Urgent Needs")
	if err != nil {
		t.Fatalf("Expected no error bookmarking candidate, got %v", err)
	}

	bookmarkID := uuid.New()
	err = svc.RemoveSavedCandidate(context.Background(), bookmarkID)
	if err != nil {
		t.Fatalf("Expected no error deleting bookmark, got %v", err)
	}
}

func TestAddAndGetRecruiterNotes(t *testing.T) {
	provider := NewPostgresSearchProvider(nil)
	repo := repository.NewSearchRepository(nil)
	recRepo := recruiterRepo.NewRecruiterRepository(nil)
	svc := NewSearchService(provider, repo, recRepo)

	userID := uuid.New()
	candidateID := uuid.New()

	err := svc.AddRecruiterNote(context.Background(), userID, candidateID, "Candidate cleared backend screening.")
	if err != nil {
		t.Fatalf("Expected no error writing notes, got %v", err)
	}

	notes, err := svc.GetRecruiterNotes(context.Background(), candidateID)
	if err != nil {
		t.Fatalf("Expected no error reading notes, got %v", err)
	}

	if len(notes) != 1 {
		t.Errorf("Expected exactly 1 note stub, got %d", len(notes))
	}

	if notes[0].Notes != "Had a screening call; candidate represents strong backend architecture capabilities." {
		t.Errorf("Expected notes mismatch, got: %s", notes[0].Notes)
	}
}
