package repository

import (
	"context"
	"testing"

	"kirmya/internal/jobs/models"

	"github.com/stretchr/testify/assert"
)

func TestJobRepositoryNormalizePage(t *testing.T) {
	page, limit, offset := normalizePage(0, 0)
	assert.Equal(t, 1, page)
	assert.Equal(t, 20, limit)
	assert.Equal(t, 0, offset)

	page, limit, offset = normalizePage(3, 50)
	assert.Equal(t, 3, page)
	assert.Equal(t, 50, limit)
	assert.Equal(t, 100, offset)

	page, limit, offset = normalizePage(1, 500)
	assert.Equal(t, 1, page)
	assert.Equal(t, maxPageSize, limit)
	assert.Equal(t, 0, offset)
}

func TestJobRepositoryNilDBError(t *testing.T) {
	repo := NewJobRepository(nil)
	assert.NotNil(t, repo)

	_, err := repo.SearchJobs(context.Background(), models.JobSearchQuery{})
	assert.Equal(t, ErrNoDatabase, err)
}
