package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/notification/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNotificationRepositoryLifecycle(t *testing.T) {
	repo := NewNotificationRepository(nil)
	ctx := context.Background()

	userID := uuid.New()
	notifID := uuid.New()

	// 1. Create Notification
	notif := &models.Notification{
		ID:        notifID,
		UserID:    userID,
		Category:  "network",
		Type:      "connection_accepted",
		Priority:  "normal",
		Title:     "Connection Request Accepted",
		Content:   "Marcus Vance accepted your connection request.",
		IsRead:    false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err := repo.Create(ctx, notif)
	require.NoError(t, err)

	// 2. Fetch Unread Count
	count, err := repo.GetUnreadCount(ctx, userID)
	require.NoError(t, err)
	assert.Equal(t, int64(1), count)

	// 3. Mark as Read
	err = repo.MarkRead(ctx, notifID, userID)
	require.NoError(t, err)

	// 4. Verify Unread Count is 0
	countAfter, err := repo.GetUnreadCount(ctx, userID)
	require.NoError(t, err)
	assert.Equal(t, int64(0), countAfter)
}
