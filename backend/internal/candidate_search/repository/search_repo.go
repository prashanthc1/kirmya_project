package repository

import (
	"context"
	"kirmya/internal/candidate_search/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SearchRepository struct {
	db *pgxpool.Pool
}

func NewSearchRepository(db *pgxpool.Pool) *SearchRepository {
	return &SearchRepository{db: db}
}

// SaveSearchHistory caches the recruiter's queries.
func (r *SearchRepository) SaveSearchHistory(ctx context.Context, recruiterID uuid.UUID, query string, filters *models.SearchFilters) error {
	if r.db == nil {
		return nil
	}
	id := uuid.New()
	q := "INSERT INTO candidate_search_history (id, recruiter_id, query, filters) VALUES ($1, $2, $3, $4)"
	_, err := r.db.Exec(ctx, q, id, recruiterID, query, filters)
	return err
}

// GetSearchHistory returns search logs.
func (r *SearchRepository) GetSearchHistory(ctx context.Context, recruiterID uuid.UUID) ([]models.SearchHistory, error) {
	if r.db == nil {
		return []models.SearchHistory{}, nil
	}

	q := "SELECT id, recruiter_id, query, filters, created_at FROM candidate_search_history WHERE recruiter_id = $1 ORDER BY created_at DESC LIMIT 10"
	rows, err := r.db.Query(ctx, q, recruiterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.SearchHistory
	for rows.Next() {
		var h models.SearchHistory
		err := rows.Scan(&h.ID, &h.RecruiterID, &h.Query, &h.Filters, &h.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, nil
}

// SaveCandidate bookmarks a candidate.
func (r *SearchRepository) SaveCandidate(ctx context.Context, recruiterID, candidateID uuid.UUID, listName string) error {
	if r.db == nil {
		return nil
	}
	if listName == "" {
		listName = "General"
	}
	id := uuid.New()
	q := "INSERT INTO saved_candidates (id, recruiter_id, candidate_id, list_name) VALUES ($1, $2, $3, $4)"
	_, err := r.db.Exec(ctx, q, id, recruiterID, candidateID, listName)
	return err
}

// GetSavedCandidates lists folders.
func (r *SearchRepository) GetSavedCandidates(ctx context.Context, recruiterID uuid.UUID) ([]models.SavedCandidate, error) {
	if r.db == nil {
		return []models.SavedCandidate{}, nil
	}

	q := "SELECT id, recruiter_id, candidate_id, list_name, created_at FROM saved_candidates WHERE recruiter_id = $1 ORDER BY created_at DESC"
	rows, err := r.db.Query(ctx, q, recruiterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.SavedCandidate
	for rows.Next() {
		var s models.SavedCandidate
		err := rows.Scan(&s.ID, &s.RecruiterID, &s.CandidateID, &s.ListName, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

// RemoveSavedCandidate deletes a bookmark.
func (r *SearchRepository) RemoveSavedCandidate(ctx context.Context, bookmarkID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	q := "DELETE FROM saved_candidates WHERE id = $1"
	_, err := r.db.Exec(ctx, q, bookmarkID)
	return err
}

// AddRecruiterNote saves a note.
func (r *SearchRepository) AddRecruiterNote(ctx context.Context, recruiterID, candidateID uuid.UUID, notes string) error {
	if r.db == nil {
		return nil
	}
	id := uuid.New()
	q := `INSERT INTO recruiter_notes (id, recruiter_id, candidate_id, notes, created_at, updated_at) 
	      VALUES ($1, $2, $3, $4, NOW(), NOW())`
	_, err := r.db.Exec(ctx, q, id, recruiterID, candidateID, notes)
	return err
}

// GetRecruiterNotes returns notes.
func (r *SearchRepository) GetRecruiterNotes(ctx context.Context, candidateID uuid.UUID) ([]models.RecruiterNote, error) {
	if r.db == nil {
		return []models.RecruiterNote{}, nil
	}

	q := "SELECT id, recruiter_id, candidate_id, notes, created_at, updated_at FROM recruiter_notes WHERE candidate_id = $1 ORDER BY created_at DESC"
	rows, err := r.db.Query(ctx, q, candidateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.RecruiterNote
	for rows.Next() {
		var n models.RecruiterNote
		err := rows.Scan(&n.ID, &n.RecruiterID, &n.CandidateID, &n.Notes, &n.CreatedAt, &n.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}
