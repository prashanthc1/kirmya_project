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

	_, err = repo.GetJobByID(context.Background(), "123")
	assert.Equal(t, ErrNoDatabase, err)
}

func TestParseLinesOrJSON(t *testing.T) {
	// Empty string
	assert.Equal(t, []string{}, parseLinesOrJSON(""))
	assert.Equal(t, []string{}, parseLinesOrJSON("   "))

	// JSON array
	jsonStr := `["Go", "Kubernetes", "PostgreSQL"]`
	assert.Equal(t, []string{"Go", "Kubernetes", "PostgreSQL"}, parseLinesOrJSON(jsonStr))

	// Multi-line bullet points
	bulletStr := "- 5+ years experience\n* Proficiency in Go\n• Cloud architectures"
	expected := []string{"5+ years experience", "Proficiency in Go", "Cloud architectures"}
	assert.Equal(t, expected, parseLinesOrJSON(bulletStr))

	// Plain single line
	plain := "Bachelor's degree in CS"
	assert.Equal(t, []string{"Bachelor's degree in CS"}, parseLinesOrJSON(plain))
}
