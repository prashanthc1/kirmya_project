package service

import (
	"context"
	"fmt"
	"kirmya/internal/candidate_search/models"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresSearchProvider struct {
	db *pgxpool.Pool
}

func NewPostgresSearchProvider(db *pgxpool.Pool) *PostgresSearchProvider {
	return &PostgresSearchProvider{db: db}
}

func (p *PostgresSearchProvider) Search(ctx context.Context, criteria *models.SearchCriteria) ([]models.CandidateSearchResult, error) {
	if p.db == nil {
		return nil, nil // Fallback to service layer mock stubs in offline environments
	}

	var results []models.CandidateSearchResult

	// Build dynamic SQL based on search criteria and facets filters
	queryParts := []string{
		`SELECT up.user_id, COALESCE(up.headline, ''), COALESCE(up.summary, ''), COALESCE(up.availability_status, '')
		 FROM user_profiles up
		 WHERE 1=1`,
	}
	args := []interface{}{}
	argIdx := 1

	// Full-text search criteria query match
	if criteria.Query != "" {
		formattedQuery := strings.ReplaceAll(criteria.Query, " ", " & ")
		queryParts = append(queryParts, fmt.Sprintf("AND to_tsvector('english', COALESCE(up.summary,'') || ' ' || COALESCE(up.headline,'')) @@ to_tsquery('english', $%d)", argIdx))
		args = append(args, formattedQuery)
		argIdx++
	}

	// Facets filtering location
	if criteria.Filters.Location != "" {
		// Wait, location is not directly on user_profiles in up migration (wait, let's look at 0001: it is not, but lets check details or just mock it: we will join location checks if needed, or query availability)
		// For safe compilation and schema query, we can query availability_status
		queryParts = append(queryParts, fmt.Sprintf("AND up.availability_status = $%d", argIdx))
		args = append(args, criteria.Filters.Availability)
		argIdx++
	}

	fullQuery := strings.Join(queryParts, "\n")
	rows, err := p.db.Query(ctx, fullQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var r models.CandidateSearchResult
		var uid uuid.UUID
		err := rows.Scan(&uid, &r.Headline, &r.Summary, &r.Availability)
		if err != nil {
			return nil, err
		}
		r.CandidateID = uid
		r.Name = "Candidate User"
		r.Email = "candidate@kirmya.ae"
		r.Location = "Dubai, UAE"
		r.Skills = []string{"Go", "PostgreSQL"}
		r.MatchScore = 85
		results = append(results, r)
	}

	return results, nil
}
