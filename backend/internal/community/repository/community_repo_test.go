package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/community/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCommunityRepositoryLifecycle(t *testing.T) {
	repo := NewCommunityRepository(nil)
	ctx := context.Background()

	ownerID := uuid.New()
	commID := uuid.New()

	// 1. Create Community
	comm := &models.Community{
		ID:          commID,
		Title:       "PostgreSQL Architecture Enthusiasts",
		Description: "Deep dive into ACID and transactions",
		Category:    "Technology",
		Location:    "Dubai",
		Visibility:  "public",
		OwnerID:     ownerID,
		MemberCount: 1,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	err := repo.Create(ctx, comm)
	require.NoError(t, err)

	// 2. Fetch by ID
	fetched, err := repo.GetByID(ctx, commID)
	require.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, "PostgreSQL Architecture Enthusiasts", fetched.Title)

	// 3. Add Member
	memberID := uuid.New()
	mem := &models.CommunityMember{
		ID:          uuid.New(),
		CommunityID: commID,
		UserID:      memberID,
		RoleName:    "member",
		Status:      "active",
		JoinedAt:    time.Now(),
		CreatedAt:   time.Now(),
	}
	err = repo.CreateMember(ctx, mem)
	require.NoError(t, err)

	fetchedMem, err := repo.GetMember(ctx, commID, memberID)
	require.NoError(t, err)
	assert.NotNil(t, fetchedMem)
	assert.Equal(t, "active", fetchedMem.Status)

	// 4. Create Post
	postID := uuid.New()
	post := &models.CommunityPost{
		ID:          postID,
		CommunityID: commID,
		UserID:      memberID,
		Title:       "Best index patterns for high concurrency",
		Content:     "Let's discuss partial and composite indexes.",
		CreatedAt:   time.Now(),
	}
	err = repo.CreatePost(ctx, post)
	require.NoError(t, err)

	fetchedPost, err := repo.GetPostByID(ctx, postID)
	require.NoError(t, err)
	assert.NotNil(t, fetchedPost)
	assert.Equal(t, "Best index patterns for high concurrency", fetchedPost.Title)
}
