package service

import (
	"context"
	"kirmya/internal/candidate_search/models"
)

type OpenSearchSearchProvider struct {
	// Ready for official OpenSearch client integrations
}

func NewOpenSearchSearchProvider() *OpenSearchSearchProvider {
	return &OpenSearchSearchProvider{}
}

func (o *OpenSearchSearchProvider) Search(ctx context.Context, criteria *models.SearchCriteria) ([]models.CandidateSearchResult, error) {
	// OpenSearch cluster client trace log stub
	return []models.CandidateSearchResult{}, nil
}
