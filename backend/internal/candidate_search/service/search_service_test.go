package service

import (
	"context"
	"kirmya/internal/candidate_search/models"
	"kirmya/internal/candidate_search/repository"
	recruiterRepo "kirmya/internal/recruiter/repository"
	"testing"

	"github.com/google/uuid"
)

// Candidate search resolves the caller's recruiter profile first, so with no
// database it fails.
//
// This was named "Offline" and asserted that searching without a database
// succeeds. It did - because the recruiter repository answered a nil-database
// caller with an invented profile marked Verified, which is the same
// fabrication that let any authenticated account acquire recruiter authority
// simply by calling a recruiter endpoint.
func TestSearchCandidatesNeedsADatabase(t *testing.T) {
	svc := NewSearchService(NewPostgresSearchProvider(nil), repository.NewSearchRepository(nil), recruiterRepo.NewRecruiterRepository(nil))

	if _, err := svc.SearchCandidates(context.Background(), uuid.New(), &models.SearchCriteria{
		Query: "Go",
	}); err == nil {
		t.Error("expected candidate search with no database to fail rather than answer")
	}
}

// Bookmarking a candidate writes a row against the caller's recruiter profile.
// With no database it fails rather than reporting a save that did not happen.
func TestSaveCandidateNeedsADatabase(t *testing.T) {
	svc := NewSearchService(NewPostgresSearchProvider(nil), repository.NewSearchRepository(nil), recruiterRepo.NewRecruiterRepository(nil))

	if err := svc.SaveCandidate(context.Background(), uuid.New(), uuid.New(), ""); err == nil {
		t.Error("expected saving a candidate with no database to fail")
	}
}

// Recruiter notes are written against the caller's recruiter profile.
func TestRecruiterNotesNeedADatabase(t *testing.T) {
	svc := NewSearchService(NewPostgresSearchProvider(nil), repository.NewSearchRepository(nil), recruiterRepo.NewRecruiterRepository(nil))

	// Writing a note resolves the caller's recruiter profile, so with no
	// database it fails rather than provisioning one.
	if err := svc.AddRecruiterNote(context.Background(), uuid.New(), uuid.New(), "note"); err == nil {
		t.Error("expected writing a recruiter note with no database to fail")
	}
}
