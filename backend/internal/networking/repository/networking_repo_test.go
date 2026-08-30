package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/networking/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestNetworkingRepositoryInMemoryLifecycle(t *testing.T) {
	repo := NewNetworkingRepository(nil)
	ctx := context.Background()

	u1 := uuid.New()
	u2 := uuid.New()

	// 1. Create connection request
	req := &models.ConnectionRequest{
		ID:         uuid.New(),
		SenderID:   u1,
		ReceiverID: u2,
		Status:     "pending",
		Note:       "Let's connect!",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	err := repo.CreateRequest(ctx, req)
	assert.NoError(t, err)

	// 2. Fetch pending request
	fetched, err := repo.GetRequest(ctx, req.ID)
	assert.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, "pending", fetched.Status)

	// 3. Accept request atomically
	err = repo.AcceptRequestTx(ctx, req.ID, u2)
	assert.NoError(t, err)

	// 4. Verify connection exists
	pair, err := repo.GetConnectionPair(ctx, u1, u2)
	assert.NoError(t, err)
	assert.NotNil(t, pair)

	// 5. List connections for u1
	conns, err := repo.ListConnections(ctx, u1)
	assert.NoError(t, err)
	assert.Contains(t, conns, u2)

	// 6. Block user
	err = repo.CreateBlock(ctx, &models.BlockedUser{
		ID:        uuid.New(),
		BlockerID: u1,
		BlockedID: u2,
		CreatedAt: time.Now(),
	})
	assert.NoError(t, err)

	blocked, err := repo.IsBlocked(ctx, u1, u2)
	assert.NoError(t, err)
	assert.True(t, blocked)

	// 7. Delete connection
	err = repo.DeleteConnection(ctx, u1, u2)
	assert.NoError(t, err)

	connsAfter, err := repo.ListConnections(ctx, u1)
	assert.NoError(t, err)
	assert.NotContains(t, connsAfter, u2)
}
