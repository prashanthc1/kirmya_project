package service

import (
	"context"
	"kirmya/internal/candidate_search/models"
)

// SearchProvider decouples search algorithms (Postgres FTS, OpenSearch, etc.).
type SearchProvider interface {
	Search(ctx context.Context, criteria *models.SearchCriteria) ([]models.CandidateSearchResult, error)
}
