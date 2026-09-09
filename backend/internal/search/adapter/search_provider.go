package adapter

import (
	"context"
	"errors"
	"strings"

	"kirmya/internal/search/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CandidateSearchProvider defines the interface for candidate discovery engines.
type CandidateSearchProvider interface {
	SearchCandidates(ctx context.Context, q domain.CandidateSearchQuery) (*domain.CandidateSearchResponse, error)
	CandidateByID(ctx context.Context, candidateID uuid.UUID) (*domain.CandidateSearchResultItem, error)
	EngineName() string
}

type PostgreSQLCandidateSearchEngine struct {
	db *pgxpool.Pool
}

func NewPostgreSQLCandidateSearchEngine(db *pgxpool.Pool) *PostgreSQLCandidateSearchEngine {
	return &PostgreSQLCandidateSearchEngine{db: db}
}

func (e *PostgreSQLCandidateSearchEngine) EngineName() string {
	return "postgresql-tsvector-v2"
}

func (e *PostgreSQLCandidateSearchEngine) SearchCandidates(ctx context.Context, q domain.CandidateSearchQuery) (*domain.CandidateSearchResponse, error) {
	page := q.Page
	if page <= 0 {
		page = 1
	}
	limit := q.Limit
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	// The facet counts here were literals - "Golang: 42", "Dubai, UAE: 112" -
	// presented beside real results as if they counted the platform. Nothing
	// counts them, so none are returned.
	facets := map[string]map[string]int{}

	if e.db != nil {
		offset := (page - 1) * limit
		querySQL := `
			SELECT u.id, u.id,
			       COALESCE(u.first_name || ' ' || u.last_name, u.email) as name,
			       COALESCE(p.headline, 'Professional') as headline,
			       COALESCE(p.current_position, '') as current_position,
			       COALESCE(p.location, 'Global') as location,
			       COALESCE(p.profile_completed_percentage, 80) as profile_completed,
			       COALESCE(p.availability_status, 'Immediate') as availability,
			       COALESCE(p.open_to_work, true) as open_to_work
			FROM users u
			LEFT JOIN user_profiles p ON u.id = p.user_id
			LEFT JOIN privacy_preferences pp ON pp.user_id = u.id
			WHERE u.status = 'active'
			  AND (p.is_restricted IS NULL OR p.is_restricted = false)
			  AND (p.is_private IS NULL OR p.is_private = false)
			  AND COALESCE(pp.discover_in_search,true)=true
			  AND COALESCE(pp.recruiter_discoverable,true)=true
			  AND (
			      $1 = ''
			      OR lower(u.first_name || ' ' || u.last_name) LIKE '%' || lower($1) || '%'
			      OR lower(COALESCE(p.headline, '')) LIKE '%' || lower($1) || '%'
			      OR lower(COALESCE(p.current_position, '')) LIKE '%' || lower($1) || '%'
			  )
			ORDER BY u.created_at DESC
			LIMIT $2 OFFSET $3
		`
		rows, err := e.db.Query(ctx, querySQL, strings.TrimSpace(q.Query), limit, offset)
		if err == nil {
			defer rows.Close()
			var candidates []domain.CandidateSearchResultItem
			for rows.Next() {
				var c domain.CandidateSearchResultItem
				// A scan error used to drop the row silently, which reads as a
				// candidate who does not match rather than as a failure. Privacy
				// filtering decides who is visible here, so a row that cannot be
				// read has to surface instead of disappearing.
				if err := rows.Scan(
					&c.ID, &c.UserID, &c.Name, &c.Headline, &c.CurrentPosition,
					&c.Location, &c.ProfileCompletion, &c.Availability, &c.OpenToWork,
				); err != nil {
					return nil, err
				}
				// Every row used to be stamped with the same three skills and
				// the same 92% "AI match", including the matching-skills list
				// and the note "Strong potential candidate". None of it was
				// computed from the candidate. A match against a specific job
				// is what GetCandidateMatch answers; a search result carries no
				// score.
				c.Skills = []string{}
				candidates = append(candidates, c)
			}
			return &domain.CandidateSearchResponse{
				Query:        q.Query,
				TotalResults: len(candidates),
				Page:         page,
				Limit:        limit,
				EngineUsed:   e.EngineName(),
				Candidates:   candidates,
				Facets:       facets,
			}, rows.Err()
		}
		return nil, err
	}

	// There is no fallback. The engine is named for PostgreSQL and it either
	// searches PostgreSQL or it fails. What stood here was a "mock candidates
	// fallback for testing and development" - three invented people with stock
	// resume URLs, AI match scores of 96/94/91, salary expectations and
	// certifications - and because the service constructed this engine with a
	// nil pool, it was the only branch production ever took.
	return nil, errors.New("candidate search requires PostgreSQL")
}

// CandidateByID reads one candidate, subject to the same privacy filters as a
// search: someone who has opted out of discovery is not found by id either.
func (e *PostgreSQLCandidateSearchEngine) CandidateByID(ctx context.Context, candidateID uuid.UUID) (*domain.CandidateSearchResultItem, error) {
	if e.db == nil {
		return nil, errors.New("candidate lookup requires PostgreSQL")
	}
	var c domain.CandidateSearchResultItem
	err := e.db.QueryRow(ctx, `
		SELECT u.id, u.id,
		       COALESCE(u.first_name || ' ' || u.last_name, u.email),
		       COALESCE(p.headline, ''),
		       COALESCE(p.current_position, ''),
		       COALESCE(p.location, ''),
		       COALESCE(p.profile_completed_percentage, 0),
		       COALESCE(p.availability_status, ''),
		       COALESCE(p.open_to_work, false)
		FROM users u
		LEFT JOIN user_profiles p ON u.id = p.user_id
		LEFT JOIN privacy_preferences pp ON pp.user_id = u.id
		WHERE u.id = $1
		  AND u.status = 'active'
		  AND (p.is_restricted IS NULL OR p.is_restricted = false)
		  AND (p.is_private IS NULL OR p.is_private = false)
		  AND COALESCE(pp.discover_in_search,true)=true
		  AND COALESCE(pp.recruiter_discoverable,true)=true`, candidateID).
		Scan(&c.ID, &c.UserID, &c.Name, &c.Headline, &c.CurrentPosition,
			&c.Location, &c.ProfileCompletion, &c.Availability, &c.OpenToWork)
	if err != nil {
		return nil, err
	}
	c.Skills = []string{}
	return &c, nil
}
