package models

import (
	"time"

	"github.com/google/uuid"
)

// Connection represents an accepted connection.
type Connection struct {
	ID        uuid.UUID `json:"id"`
	UserID1   uuid.UUID `json:"userId1"`
	UserID2   uuid.UUID `json:"userId2"`
	CreatedAt time.Time `json:"createdAt"`
}

// ConnectionRequest represents invitation invitations.
type ConnectionRequest struct {
	ID         uuid.UUID `json:"id"`
	SenderID   uuid.UUID `json:"senderId"`
	ReceiverID uuid.UUID `json:"receiverId"`
	Status     string    `json:"status"` // pending, accepted, rejected
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// BlockedUser represents one-way block limits.
type BlockedUser struct {
	ID        uuid.UUID `json:"id"`
	BlockerID uuid.UUID `json:"blockerId"`
	BlockedID uuid.UUID `json:"blockedId"`
	CreatedAt time.Time `json:"createdAt"`
}

// ConnectionRecommendation represents recommended people to connect with.
type ConnectionRecommendation struct {
	UserID            uuid.UUID `json:"userId"`
	Name              string    `json:"name"`
	Headline          string    `json:"headline"`
	Location          string    `json:"location"`
	Industry          string    `json:"industry"`
	MutualCount       int       `json:"mutualCount"`
	MutualConnections []string  `json:"mutualConnections"`
	MatchScore        int       `json:"matchScore"` // 0-100 match percentage
}
