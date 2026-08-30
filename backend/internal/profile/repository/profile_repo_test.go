package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestProfileRepositoryConstructor(t *testing.T) {
	repo := NewProfileRepository(nil)
	assert.NotNil(t, repo)
}
